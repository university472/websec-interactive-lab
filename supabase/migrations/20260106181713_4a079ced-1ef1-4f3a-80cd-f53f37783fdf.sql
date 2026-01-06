-- Create role enum type
CREATE TYPE public.app_role AS ENUM ('learner', 'instructor', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'learner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create modules table
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  estimated_minutes INTEGER NOT NULL DEFAULT 30,
  content JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_progress table
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

-- Create tasks table (lab tasks within modules)
CREATE TABLE public.lab_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  expected_pattern TEXT, -- regex pattern to detect successful completion
  hint TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create task completions table
CREATE TABLE public.task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.lab_tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempts INTEGER NOT NULL DEFAULT 1,
  UNIQUE (user_id, task_id)
);

-- Create quiz questions table
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- array of {text, isCorrect}
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create quiz answers table
CREATE TABLE public.quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_option INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);

-- Create certificates table
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  full_name TEXT NOT NULL,
  completion_percentage INTEGER NOT NULL DEFAULT 100,
  total_time_seconds INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'instructor' THEN 2 
      WHEN 'learner' THEN 3 
    END
  LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'instructor'));

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Modules policies (public read, admin write)
CREATE POLICY "Everyone can view active modules"
  ON public.modules FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage modules"
  ON public.modules FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- User progress policies
CREATE POLICY "Users can view their own progress"
  ON public.user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own progress"
  ON public.user_progress FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Instructors can view all progress"
  ON public.user_progress FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin'));

-- Lab tasks policies
CREATE POLICY "Authenticated users can view tasks"
  ON public.lab_tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage tasks"
  ON public.lab_tasks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Task completions policies
CREATE POLICY "Users can view their own task completions"
  ON public.task_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own task completions"
  ON public.task_completions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Instructors can view all task completions"
  ON public.task_completions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin'));

-- Quiz questions policies
CREATE POLICY "Authenticated users can view questions"
  ON public.quiz_questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage questions"
  ON public.quiz_questions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Quiz answers policies
CREATE POLICY "Users can view their own answers"
  ON public.quiz_answers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own answers"
  ON public.quiz_answers FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Instructors can view all answers"
  ON public.quiz_answers FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin'));

-- Certificates policies
CREATE POLICY "Users can view their own certificate"
  ON public.certificates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own certificate"
  ON public.certificates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can verify certificates by ID"
  ON public.certificates FOR SELECT
  TO anon, authenticated
  USING (true);

-- Auto-create profile and learner role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'learner');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default modules
INSERT INTO public.modules (slug, title, description, order_index, estimated_minutes, content) VALUES
('introduction', 'Introduction & Learning Objectives', 'Overview of web application security fundamentals and what you will learn in this lab.', 1, 15, '{"type": "intro"}'),
('environment-setup', 'Environment Setup', 'Quick browser-based setup walkthrough. No external installs required.', 2, 10, '{"type": "setup"}'),
('vulnerable-auth', 'Vulnerable Demo App - Authentication', 'Explore a login page with intentionally weak authentication mechanisms.', 3, 30, '{"type": "lab", "attack": "auth"}'),
('sql-injection', 'SQL Injection Vulnerability', 'Learn to identify and exploit SQL injection vulnerabilities.', 4, 45, '{"type": "lab", "attack": "sqli"}'),
('xss-vulnerability', 'Cross-Site Scripting (XSS)', 'Discover and exploit reflected XSS vulnerabilities.', 5, 45, '{"type": "lab", "attack": "xss"}'),
('secure-version', 'Secure Version Comparison', 'Compare vulnerable and secure implementations. Learn about input validation and parameterized queries.', 6, 30, '{"type": "comparison"}'),
('final-assessment', 'Final Assessment', 'Comprehensive knowledge check covering all topics.', 7, 30, '{"type": "assessment"}'),
('completion', 'Completion & Certificate', 'Summary of your achievements and certificate generation.', 8, 5, '{"type": "completion"}');

-- Insert lab tasks
INSERT INTO public.lab_tasks (module_id, title, description, instructions, expected_pattern, hint, order_index, points)
SELECT 
  m.id,
  'Identify SQL Injection Point',
  'Find the input field vulnerable to SQL injection',
  'Try entering special characters in the login form to identify potential injection points.',
  $$''|"|;|--$$,
  'Look for fields that might directly interact with a database query.',
  1,
  10
FROM public.modules m WHERE m.slug = 'sql-injection';

INSERT INTO public.lab_tasks (module_id, title, description, instructions, expected_pattern, hint, order_index, points)
SELECT 
  m.id,
  'Perform SQL Injection Login Bypass',
  'Use SQL injection to bypass the login authentication',
  'Craft a payload that makes the SQL query always return true.',
  $$'\s*OR\s*[''"]?1[''"]?\s*=\s*[''"]?1|admin[''"]?\s*--$$,
  'Think about how you can make the WHERE clause always evaluate to true.',
  2,
  20
FROM public.modules m WHERE m.slug = 'sql-injection';

INSERT INTO public.lab_tasks (module_id, title, description, instructions, expected_pattern, hint, order_index, points)
SELECT 
  m.id,
  'Identify XSS Vulnerability',
  'Find an input field that reflects user input without sanitization',
  'Look for places where your input appears on the page after submission.',
  $$<|>|script|javascript:$$,
  'Try entering HTML tags and see if they render.',
  1,
  10
FROM public.modules m WHERE m.slug = 'xss-vulnerability';

INSERT INTO public.lab_tasks (module_id, title, description, instructions, expected_pattern, hint, order_index, points)
SELECT 
  m.id,
  'Execute XSS Payload',
  'Craft and execute a simple XSS payload',
  'Create a script that displays an alert box.',
  $$<script.*>.*alert\(|onerror\s*=|onclick\s*=$$,
  'The classic payload is <script>alert(1)</script>',
  2,
  20
FROM public.modules m WHERE m.slug = 'xss-vulnerability';

-- Insert quiz questions
INSERT INTO public.quiz_questions (module_id, question, options, explanation, order_index)
SELECT 
  m.id,
  'What is SQL Injection?',
  '[{"text": "A technique to style SQL queries", "isCorrect": false}, {"text": "A code injection technique that exploits security vulnerabilities in an application''s database layer", "isCorrect": true}, {"text": "A method to optimize database performance", "isCorrect": false}, {"text": "A way to backup databases", "isCorrect": false}]'::jsonb,
  'SQL Injection is a code injection technique that exploits security vulnerabilities by inserting malicious SQL statements into application queries.',
  1
FROM public.modules m WHERE m.slug = 'sql-injection';

INSERT INTO public.quiz_questions (module_id, question, options, explanation, order_index)
SELECT 
  m.id,
  'Which SQL payload is commonly used to bypass login authentication?',
  '[{"text": "SELECT * FROM users", "isCorrect": false}, {"text": "'' OR ''1''=''1", "isCorrect": true}, {"text": "DROP TABLE users", "isCorrect": false}, {"text": "UPDATE users SET admin=1", "isCorrect": false}]'::jsonb,
  'The payload '' OR ''1''=''1 makes the WHERE clause always true, bypassing authentication checks.',
  2
FROM public.modules m WHERE m.slug = 'sql-injection';

INSERT INTO public.quiz_questions (module_id, question, options, explanation, order_index)
SELECT 
  m.id,
  'What is the best defense against SQL Injection?',
  '[{"text": "Input length limits", "isCorrect": false}, {"text": "Parameterized queries (prepared statements)", "isCorrect": true}, {"text": "Hiding error messages", "isCorrect": false}, {"text": "Using complex passwords", "isCorrect": false}]'::jsonb,
  'Parameterized queries separate SQL code from data, preventing injection attacks.',
  3
FROM public.modules m WHERE m.slug = 'sql-injection';

INSERT INTO public.quiz_questions (module_id, question, options, explanation, order_index)
SELECT 
  m.id,
  'What does XSS stand for?',
  '[{"text": "Cross-Server Scripting", "isCorrect": false}, {"text": "Cross-Site Scripting", "isCorrect": true}, {"text": "Cross-System Security", "isCorrect": false}, {"text": "Extended Style Sheets", "isCorrect": false}]'::jsonb,
  'XSS stands for Cross-Site Scripting, a vulnerability that allows attackers to inject malicious scripts.',
  1
FROM public.modules m WHERE m.slug = 'xss-vulnerability';

INSERT INTO public.quiz_questions (module_id, question, options, explanation, order_index)
SELECT 
  m.id,
  'What type of XSS occurs when malicious script is reflected off a web server?',
  '[{"text": "Stored XSS", "isCorrect": false}, {"text": "Reflected XSS", "isCorrect": true}, {"text": "DOM-based XSS", "isCorrect": false}, {"text": "Persistent XSS", "isCorrect": false}]'::jsonb,
  'Reflected XSS occurs when the injected script is reflected off the web server, typically via URL parameters.',
  2
FROM public.modules m WHERE m.slug = 'xss-vulnerability';

INSERT INTO public.quiz_questions (module_id, question, options, explanation, order_index)
SELECT 
  m.id,
  'Which method helps prevent XSS attacks?',
  '[{"text": "Using HTTPS", "isCorrect": false}, {"text": "Output encoding/escaping", "isCorrect": true}, {"text": "Strong passwords", "isCorrect": false}, {"text": "Firewall rules", "isCorrect": false}]'::jsonb,
  'Output encoding ensures that user input is displayed as data, not executable code.',
  3
FROM public.modules m WHERE m.slug = 'xss-vulnerability';