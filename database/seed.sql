-- =============================================================
--  Codle — development seed data
--  Generated from index.html (learning path) and js/wordle-words.js.
--  Run after schema.sql. Contains no personal data.
-- =============================================================

SET NAMES utf8mb4;
USE codle;

INSERT INTO courses (slug, name, is_published, sort_order) VALUES
  ('python', 'Python', 1, 1),
  ('javascript', 'JavaScript', 1, 2),
  ('html', 'HTML', 0, 3),
  ('css', 'CSS', 0, 4),
  ('php', 'PHP', 0, 5);

INSERT INTO units (course_id, position, title) SELECT id, 1, 'Variables & Types' FROM courses WHERE slug = 'python';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'hello-world', 'Hello World', 'lesson', 20),
  (@unit, 2, 'variables', 'Variables', 'lesson', 20),
  (@unit, 3, 'data-types', 'Data Types', 'lesson', 20),
  (@unit, 4, 'strings', 'Strings', 'lesson', 20),
  (@unit, 5, 'numbers', 'Numbers', 'lesson', 20),
  (@unit, 6, 'type-casting', 'Type Casting', 'lesson', 20),
  (@unit, 7, 'boolean-logic', 'Boolean Logic', 'lesson', 20),
  (@unit, 8, 'unit-1-quiz', 'Unit 1 Quiz', 'quiz', 50);

INSERT INTO units (course_id, position, title) SELECT id, 2, 'Functions' FROM courses WHERE slug = 'python';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'defining-functions', 'Defining Functions', 'lesson', 20),
  (@unit, 2, 'parameters', 'Parameters', 'lesson', 20),
  (@unit, 3, 'return-values', 'Return Values', 'lesson', 20),
  (@unit, 4, 'scope', 'Scope', 'lesson', 20),
  (@unit, 5, 'lambda-functions', 'Lambda Functions', 'lesson', 20),
  (@unit, 6, 'unit-2-quiz', 'Unit 2 Quiz', 'quiz', 50);

INSERT INTO units (course_id, position, title) SELECT id, 3, 'Data Structures' FROM courses WHERE slug = 'python';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'lists', 'Lists', 'lesson', 20),
  (@unit, 2, 'dictionaries', 'Dictionaries', 'lesson', 20),
  (@unit, 3, 'sets', 'Sets', 'lesson', 20),
  (@unit, 4, 'tuples', 'Tuples', 'lesson', 20),
  (@unit, 5, 'unit-3-quiz', 'Unit 3 Quiz', 'quiz', 50);

INSERT INTO units (course_id, position, title) SELECT id, 4, 'Algorithms' FROM courses WHERE slug = 'python';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'sorting', 'Sorting', 'lesson', 20),
  (@unit, 2, 'searching', 'Searching', 'lesson', 20),
  (@unit, 3, 'recursion', 'Recursion', 'lesson', 20),
  (@unit, 4, 'final-exam', 'Final Exam', 'exam', 100);

INSERT INTO units (course_id, position, title) SELECT id, 1, 'JS Basics' FROM courses WHERE slug = 'javascript';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'console-log', 'Console Log', 'lesson', 20),
  (@unit, 2, 'variables', 'Variables', 'lesson', 20),
  (@unit, 3, 'data-types', 'Data Types', 'lesson', 20);

INSERT INTO units (course_id, position, title) SELECT id, 2, 'Functions & Scope' FROM courses WHERE slug = 'javascript';
SET @unit = LAST_INSERT_ID();
INSERT INTO lessons (unit_id, position, slug, title, kind, xp_reward) VALUES
  (@unit, 1, 'arrow-functions', 'Arrow Functions', 'lesson', 20),
  (@unit, 2, 'closures', 'Closures', 'lesson', 20);

INSERT INTO badges (slug, name, description, unit_id)
SELECT 'pythonista-1', 'Pythonista I', 'Complete Unit 2', u.id FROM units u JOIN courses c ON c.id = u.course_id WHERE c.slug = 'python' AND u.position = 2;

INSERT INTO wordle_words (word, hint) VALUES
  ('ARRAY', 'An ordered collection of items stored at numbered positions.'),
  ('CLASS', 'A blueprint for creating objects with shared attributes and methods.'),
  ('FLOAT', 'A number type that can hold decimal values.'),
  ('INDEX', 'The position of an item inside a sequence, usually counted from 0.'),
  ('INPUT', 'Data given to a program by the user or another source.'),
  ('PRINT', 'A function that writes text to the console.'),
  ('RANGE', 'A sequence of numbers from a start to an end, often used in loops.'),
  ('TUPLE', 'An ordered collection of values that cannot be changed after creation.'),
  ('WHILE', 'A loop that keeps repeating as long as its condition is true.'),
  ('BREAK', 'A statement that exits a loop early.'),
  ('CONST', 'A keyword that declares a value which cannot be reassigned.'),
  ('DEBUG', 'The process of finding and fixing errors in code.'),
  ('STACK', 'A last-in, first-out data structure.'),
  ('QUEUE', 'A first-in, first-out data structure.'),
  ('SCOPE', 'The region of code where a variable can be accessed.'),
  ('YIELD', 'A keyword that pauses a generator and hands back a value.'),
  ('ASYNC', 'A keyword marking a function that runs without blocking.'),
  ('AWAIT', 'A keyword that pauses an async function until a promise settles.'),
  ('SLICE', 'Taking a section of a list or string using start and end positions.'),
  ('SHELL', 'A text interface for running commands on the operating system.'),
  ('BYTES', 'Raw binary data; one unit of it is 8 bits.'),
  ('REGEX', 'A pattern language for matching text.'),
  ('PARSE', 'To analyze text and turn it into structured data.'),
  ('TOKEN', 'The smallest meaningful unit of code, like a keyword or a symbol.'),
  ('MERGE', 'Combining changes from two branches into one.'),
  ('CLONE', 'Making a full copy of a repository or an object.'),
  ('FETCH', 'Requesting data from a server or a remote source.'),
  ('PROXY', 'A middleman that forwards requests between a client and a server.'),
  ('CACHE', 'Temporary storage that keeps data close by for faster access.'),
  ('QUERY', 'A request for data from a database.'),
  ('TABLE', 'Rows and columns of data in a database.'),
  ('FIELD', 'A single named piece of data inside a record or an object.'),
  ('EVENT', 'Something that happens in a program, like a click, that code can react to.'),
  ('MUTEX', 'A lock that lets only one thread use a resource at a time.'),
  ('BLOCK', 'A group of statements that belong together, indented or inside braces.'),
  ('CATCH', 'The part of error handling that runs when an exception is thrown.'),
  ('THROW', 'Raising an error on purpose so it can be handled elsewhere.'),
  ('RAISE', 'Python''s keyword for triggering an exception.'),
  ('ERROR', 'A problem that stops a program from running correctly.'),
  ('FALSE', 'One of the two boolean values.'),
  ('SUPER', 'A reference to the parent class from inside a subclass.'),
  ('MIXIN', 'A class that adds reusable behavior to other classes.'),
  ('TRAIT', 'A set of methods that a type can share or implement.'),
  ('BUILD', 'Turning source code into something that can run or ship.'),
  ('LOGIC', 'The rules and conditions that decide what a program does.'),
  ('STATE', 'The data a program remembers at a given moment.'),
  ('PROPS', 'Values passed into a component from its parent.'),
  ('STYLE', 'Rules that control how something looks on screen.'),
  ('SHIFT', 'Removing the first element of an array in JavaScript.'),
  ('SPLIT', 'Breaking a string into a list of parts around a separator.'),
  ('STRIP', 'Removing whitespace from both ends of a string.'),
  ('MATCH', 'Checking whether a value fits a pattern.'),
  ('COUNT', 'The number of times something appears.'),
  ('LOCAL', 'A variable that only exists inside the function that created it.'),
  ('FINAL', 'A value or class that cannot be changed or extended.'),
  ('ASCII', 'A standard that maps characters to the numbers 0 to 127.'),
  ('OCTAL', 'The base-8 number system.'),
  ('GRAPH', 'A structure made of nodes connected by edges.'),
  ('ALIAS', 'An alternative name for a command, a module or a value.'),
  ('BATCH', 'A group of tasks processed together.'),
  ('CHUNK', 'A fixed-size piece of a larger data set.'),
  ('CODEC', 'Software that encodes or decodes data such as audio or video.'),
  ('CRASH', 'When a program stops unexpectedly because of a serious error.'),
  ('CYCLE', 'A path in a graph that returns to where it started.'),
  ('DEFER', 'Postponing an action until later, such as after a function returns.'),
  ('EMPTY', 'Containing no items at all, like [] or an empty string.'),
  ('ENTRY', 'A single key-value pair in a map or a dictionary.'),
  ('EQUAL', 'When two values are the same, tested with ==.'),
  ('FRAME', 'One entry on the call stack, holding a running function''s variables.'),
  ('GUARD', 'A condition checked early that exits before the main logic runs.'),
  ('IMAGE', 'A packaged snapshot of an app and its dependencies, ready to run in a container.'),
  ('INNER', 'A function or class defined inside another one.'),
  ('OUTER', 'The enclosing scope around an inner function.'),
  ('LABEL', 'A name attached to a form field or a position in code.'),
  ('LAYER', 'One level in a system where each level builds on the one below.'),
  ('LEVEL', 'A degree of severity, as in logging: debug, info, warning, error.'),
  ('LIMIT', 'The maximum amount allowed, such as how many rows a query returns.'),
  ('LOGIN', 'Proving who you are to get access to a system.'),
  ('MACRO', 'A rule that expands into a larger piece of code before compiling.'),
  ('MODEL', 'A representation of data and the rules around it.'),
  ('MOUNT', 'Attaching a filesystem, or inserting a component into the page.'),
  ('PANIC', 'An unrecoverable error that stops the program in Go or Rust.'),
  ('PATCH', 'A small change that fixes a bug.'),
  ('PIXEL', 'The smallest dot that makes up an image on a screen.'),
  ('POINT', 'A location given by coordinates, such as x and y.'),
  ('QUOTE', 'The character that wraps a string literal.'),
  ('RESET', 'Returning something to its starting state.'),
  ('RETRY', 'Trying an operation again after it failed.'),
  ('ROUND', 'Reducing a number to fewer decimal places.'),
  ('ROUTE', 'A path in a web app that maps a URL to code.'),
  ('SCALE', 'Growing a system so it can handle more load.'),
  ('SHAPE', 'The dimensions of an array, like rows by columns.'),
  ('SLEEP', 'Pausing a program for a set amount of time.'),
  ('STASH', 'Temporarily shelving uncommitted changes in git.'),
  ('STORE', 'A central place where application state is kept.'),
  ('TIMER', 'A mechanism that runs code after a delay or at intervals.'),
  ('TRACE', 'A record of the steps a program took, often shown after an error.'),
  ('TRUNK', 'The main line of development in version control.'),
  ('UNION', 'A combination of two sets, or a type that can be one of several.'),
  ('UPPER', 'The string method that converts text to capital letters.'),
  ('LOWER', 'The string method that converts text to small letters.'),
  ('VALID', 'Data that passes all of its checks.'),
  ('VALUE', 'The data stored in a variable or produced by an expression.'),
  ('WATCH', 'Monitoring a file or variable and reacting when it changes.'),
  ('WIDTH', 'The horizontal size of an element or an image.'),
  ('WRITE', 'Sending data to a file, a stream or an output.'),
  ('ABORT', 'Stopping an operation before it finishes.'),
  ('ADMIN', 'A user with full permissions in a system.'),
  ('AGENT', 'A program that acts on behalf of a user or another program.'),
  ('AUDIT', 'Reviewing records to check for problems or security issues.'),
  ('BOUND', 'A limit on a value, such as the last valid index of an array.'),
  ('BRACE', 'The { } characters that group a block of code.'),
  ('CHAIN', 'Calling methods one after another on the same line.'),
  ('CHILD', 'A node that sits below another node in a tree.'),
  ('CHMOD', 'The command that changes file permissions.'),
  ('COMMA', 'The character that separates items in a list.'),
  ('COLON', 'The character that ends an if, for or def line in Python.'),
  ('DELTA', 'The difference between two values or two versions.'),
  ('DEPTH', 'How many levels down a node sits in a tree.'),
  ('DIGIT', 'A single numeral from 0 to 9.'),
  ('EMAIL', 'A common form field that needs an @ to be valid.'),
  ('EMBED', 'Placing one resource inside another, like a video in a page.'),
  ('EPOCH', 'The reference moment from which time is counted, often 1 January 1970.'),
  ('FATAL', 'An error so severe that the program must stop.'),
  ('FLUSH', 'Forcing buffered data to be written out immediately.'),
  ('FOCUS', 'The element currently receiving keyboard input.'),
  ('HELLO', 'The traditional first word a new programmer prints.'),
  ('INFIX', 'Notation where the operator sits between its operands, like 2 + 3.'),
  ('INODE', 'A record that stores a file''s metadata on Unix filesystems.'),
  ('LEXER', 'A program that turns source text into tokens.'),
  ('LINUX', 'An open-source operating system kernel used on most servers.'),
  ('MONAD', 'A pattern for chaining computations that carry extra context.'),
  ('NONCE', 'A number used only once, often in security protocols.'),
  ('OCTET', 'A group of 8 bits.'),
  ('POSIX', 'A standard that keeps Unix-like systems compatible with each other.'),
  ('PRIME', 'A number divisible only by 1 and itself.'),
  ('PRUNE', 'Removing unneeded branches or data.'),
  ('RADIX', 'The base of a number system, like 10 or 2.'),
  ('SHARD', 'One partition of a database split across several machines.'),
  ('SIEVE', 'An algorithm that filters out numbers to find primes.'),
  ('SLASH', 'The / character, used in paths and for division.'),
  ('SPAWN', 'Starting a new process or thread.'),
  ('STDIN', 'The standard input stream of a program.'),
  ('TILDE', 'The ~ character, shorthand for the home directory.'),
  ('TOPIC', 'A named channel that messages are published to.'),
  ('TOUCH', 'The command that creates an empty file.'),
  ('UMASK', 'The setting that controls default file permissions.'),
  ('UNZIP', 'Extracting files from a compressed archive.'),
  ('XPATH', 'A language for selecting nodes in an XML document.'),
  ('HTTPS', 'The secure, encrypted version of the web''s transfer protocol.'),
  ('REACT', 'A JavaScript library for building user interfaces from components.'),
  ('NUMPY', 'A Python library for fast numeric arrays.'),
  ('REDIS', 'An in-memory key-value store often used as a cache.'),
  ('SCRUM', 'An agile framework that organizes work into sprints.'),
  ('SOLID', 'Five design principles for object-oriented code.'),
  ('QUINE', 'A program that prints its own source code.'),
  ('UNARY', 'An operator with a single operand, like -x or not x.'),
  ('SETUP', 'The steps that prepare an environment or a test before it runs.'),
  ('FIRST', 'What index 0 gives you.');

-- One year of daily puzzles, in the same order the client uses (#1 = 2026-10-13)
INSERT INTO wordle_puzzles (puzzle_no, puzzle_date, word_id)
SELECT p.no, p.d, w.id FROM (
  SELECT 1 AS no, DATE '2026-10-13' AS d, 'PROXY' AS word
  UNION ALL SELECT 2 AS no, DATE '2026-10-14' AS d, 'ASYNC' AS word
  UNION ALL SELECT 3 AS no, DATE '2026-10-15' AS d, 'SHAPE' AS word
  UNION ALL SELECT 4 AS no, DATE '2026-10-16' AS d, 'PATCH' AS word
  UNION ALL SELECT 5 AS no, DATE '2026-10-17' AS d, 'UNION' AS word
  UNION ALL SELECT 6 AS no, DATE '2026-10-18' AS d, 'CLONE' AS word
  UNION ALL SELECT 7 AS no, DATE '2026-10-19' AS d, 'LEXER' AS word
  UNION ALL SELECT 8 AS no, DATE '2026-10-20' AS d, 'STASH' AS word
  UNION ALL SELECT 9 AS no, DATE '2026-10-21' AS d, 'SPAWN' AS word
  UNION ALL SELECT 10 AS no, DATE '2026-10-22' AS d, 'CRASH' AS word
  UNION ALL SELECT 11 AS no, DATE '2026-10-23' AS d, 'AWAIT' AS word
  UNION ALL SELECT 12 AS no, DATE '2026-10-24' AS d, 'DEPTH' AS word
  UNION ALL SELECT 13 AS no, DATE '2026-10-25' AS d, 'BREAK' AS word
  UNION ALL SELECT 14 AS no, DATE '2026-10-26' AS d, 'ALIAS' AS word
  UNION ALL SELECT 15 AS no, DATE '2026-10-27' AS d, 'EMAIL' AS word
  UNION ALL SELECT 16 AS no, DATE '2026-10-28' AS d, 'BUILD' AS word
  UNION ALL SELECT 17 AS no, DATE '2026-10-29' AS d, 'CONST' AS word
  UNION ALL SELECT 18 AS no, DATE '2026-10-30' AS d, 'WATCH' AS word
  UNION ALL SELECT 19 AS no, DATE '2026-10-31' AS d, 'PARSE' AS word
  UNION ALL SELECT 20 AS no, DATE '2026-11-01' AS d, 'SUPER' AS word
  UNION ALL SELECT 21 AS no, DATE '2026-11-02' AS d, 'ASCII' AS word
  UNION ALL SELECT 22 AS no, DATE '2026-11-03' AS d, 'SLASH' AS word
  UNION ALL SELECT 23 AS no, DATE '2026-11-04' AS d, 'THROW' AS word
  UNION ALL SELECT 24 AS no, DATE '2026-11-05' AS d, 'SIEVE' AS word
  UNION ALL SELECT 25 AS no, DATE '2026-11-06' AS d, 'ERROR' AS word
  UNION ALL SELECT 26 AS no, DATE '2026-11-07' AS d, 'RAISE' AS word
  UNION ALL SELECT 27 AS no, DATE '2026-11-08' AS d, 'BYTES' AS word
  UNION ALL SELECT 28 AS no, DATE '2026-11-09' AS d, 'COMMA' AS word
  UNION ALL SELECT 29 AS no, DATE '2026-11-10' AS d, 'RESET' AS word
  UNION ALL SELECT 30 AS no, DATE '2026-11-11' AS d, 'MODEL' AS word
  UNION ALL SELECT 31 AS no, DATE '2026-11-12' AS d, 'REDIS' AS word
  UNION ALL SELECT 32 AS no, DATE '2026-11-13' AS d, 'UNZIP' AS word
  UNION ALL SELECT 33 AS no, DATE '2026-11-14' AS d, 'LIMIT' AS word
  UNION ALL SELECT 34 AS no, DATE '2026-11-15' AS d, 'EVENT' AS word
  UNION ALL SELECT 35 AS no, DATE '2026-11-16' AS d, 'EPOCH' AS word
  UNION ALL SELECT 36 AS no, DATE '2026-11-17' AS d, 'TABLE' AS word
  UNION ALL SELECT 37 AS no, DATE '2026-11-18' AS d, 'TIMER' AS word
  UNION ALL SELECT 38 AS no, DATE '2026-11-19' AS d, 'PANIC' AS word
  UNION ALL SELECT 39 AS no, DATE '2026-11-20' AS d, 'INNER' AS word
  UNION ALL SELECT 40 AS no, DATE '2026-11-21' AS d, 'ABORT' AS word
  UNION ALL SELECT 41 AS no, DATE '2026-11-22' AS d, 'UMASK' AS word
  UNION ALL SELECT 42 AS no, DATE '2026-11-23' AS d, 'CYCLE' AS word
  UNION ALL SELECT 43 AS no, DATE '2026-11-24' AS d, 'TOPIC' AS word
  UNION ALL SELECT 44 AS no, DATE '2026-11-25' AS d, 'MACRO' AS word
  UNION ALL SELECT 45 AS no, DATE '2026-11-26' AS d, 'MUTEX' AS word
  UNION ALL SELECT 46 AS no, DATE '2026-11-27' AS d, 'AUDIT' AS word
  UNION ALL SELECT 47 AS no, DATE '2026-11-28' AS d, 'SCRUM' AS word
  UNION ALL SELECT 48 AS no, DATE '2026-11-29' AS d, 'SPLIT' AS word
  UNION ALL SELECT 49 AS no, DATE '2026-11-30' AS d, 'EMBED' AS word
  UNION ALL SELECT 50 AS no, DATE '2026-12-01' AS d, 'FLUSH' AS word
  UNION ALL SELECT 51 AS no, DATE '2026-12-02' AS d, 'POINT' AS word
  UNION ALL SELECT 52 AS no, DATE '2026-12-03' AS d, 'RANGE' AS word
  UNION ALL SELECT 53 AS no, DATE '2026-12-04' AS d, 'TILDE' AS word
  UNION ALL SELECT 54 AS no, DATE '2026-12-05' AS d, 'SCOPE' AS word
  UNION ALL SELECT 55 AS no, DATE '2026-12-06' AS d, 'TOUCH' AS word
  UNION ALL SELECT 56 AS no, DATE '2026-12-07' AS d, 'HELLO' AS word
  UNION ALL SELECT 57 AS no, DATE '2026-12-08' AS d, 'BLOCK' AS word
  UNION ALL SELECT 58 AS no, DATE '2026-12-09' AS d, 'BOUND' AS word
  UNION ALL SELECT 59 AS no, DATE '2026-12-10' AS d, 'SCALE' AS word
  UNION ALL SELECT 60 AS no, DATE '2026-12-11' AS d, 'WRITE' AS word
  UNION ALL SELECT 61 AS no, DATE '2026-12-12' AS d, 'EQUAL' AS word
  UNION ALL SELECT 62 AS no, DATE '2026-12-13' AS d, 'LOGIC' AS word
  UNION ALL SELECT 63 AS no, DATE '2026-12-14' AS d, 'LABEL' AS word
  UNION ALL SELECT 64 AS no, DATE '2026-12-15' AS d, 'WHILE' AS word
  UNION ALL SELECT 65 AS no, DATE '2026-12-16' AS d, 'OUTER' AS word
  UNION ALL SELECT 66 AS no, DATE '2026-12-17' AS d, 'HTTPS' AS word
  UNION ALL SELECT 67 AS no, DATE '2026-12-18' AS d, 'LINUX' AS word
  UNION ALL SELECT 68 AS no, DATE '2026-12-19' AS d, 'STATE' AS word
  UNION ALL SELECT 69 AS no, DATE '2026-12-20' AS d, 'IMAGE' AS word
  UNION ALL SELECT 70 AS no, DATE '2026-12-21' AS d, 'XPATH' AS word
  UNION ALL SELECT 71 AS no, DATE '2026-12-22' AS d, 'RADIX' AS word
  UNION ALL SELECT 72 AS no, DATE '2026-12-23' AS d, 'TRACE' AS word
  UNION ALL SELECT 73 AS no, DATE '2026-12-24' AS d, 'ENTRY' AS word
  UNION ALL SELECT 74 AS no, DATE '2026-12-25' AS d, 'CACHE' AS word
  UNION ALL SELECT 75 AS no, DATE '2026-12-26' AS d, 'RETRY' AS word
  UNION ALL SELECT 76 AS no, DATE '2026-12-27' AS d, 'PRIME' AS word
  UNION ALL SELECT 77 AS no, DATE '2026-12-28' AS d, 'LOCAL' AS word
  UNION ALL SELECT 78 AS no, DATE '2026-12-29' AS d, 'GRAPH' AS word
  UNION ALL SELECT 79 AS no, DATE '2026-12-30' AS d, 'CATCH' AS word
  UNION ALL SELECT 80 AS no, DATE '2026-12-31' AS d, 'SHIFT' AS word
  UNION ALL SELECT 81 AS no, DATE '2027-01-01' AS d, 'POSIX' AS word
  UNION ALL SELECT 82 AS no, DATE '2027-01-02' AS d, 'STRIP' AS word
  UNION ALL SELECT 83 AS no, DATE '2027-01-03' AS d, 'SOLID' AS word
  UNION ALL SELECT 84 AS no, DATE '2027-01-04' AS d, 'STDIN' AS word
  UNION ALL SELECT 85 AS no, DATE '2027-01-05' AS d, 'LOWER' AS word
  UNION ALL SELECT 86 AS no, DATE '2027-01-06' AS d, 'TRAIT' AS word
  UNION ALL SELECT 87 AS no, DATE '2027-01-07' AS d, 'BRACE' AS word
  UNION ALL SELECT 88 AS no, DATE '2027-01-08' AS d, 'FLOAT' AS word
  UNION ALL SELECT 89 AS no, DATE '2027-01-09' AS d, 'STYLE' AS word
  UNION ALL SELECT 90 AS no, DATE '2027-01-10' AS d, 'TRUNK' AS word
  UNION ALL SELECT 91 AS no, DATE '2027-01-11' AS d, 'QUINE' AS word
  UNION ALL SELECT 92 AS no, DATE '2027-01-12' AS d, 'LEVEL' AS word
  UNION ALL SELECT 93 AS no, DATE '2027-01-13' AS d, 'CHMOD' AS word
  UNION ALL SELECT 94 AS no, DATE '2027-01-14' AS d, 'NONCE' AS word
  UNION ALL SELECT 95 AS no, DATE '2027-01-15' AS d, 'SHARD' AS word
  UNION ALL SELECT 96 AS no, DATE '2027-01-16' AS d, 'OCTET' AS word
  UNION ALL SELECT 97 AS no, DATE '2027-01-17' AS d, 'MATCH' AS word
  UNION ALL SELECT 98 AS no, DATE '2027-01-18' AS d, 'SHELL' AS word
  UNION ALL SELECT 99 AS no, DATE '2027-01-19' AS d, 'UPPER' AS word
  UNION ALL SELECT 100 AS no, DATE '2027-01-20' AS d, 'WIDTH' AS word
  UNION ALL SELECT 101 AS no, DATE '2027-01-21' AS d, 'CHILD' AS word
  UNION ALL SELECT 102 AS no, DATE '2027-01-22' AS d, 'CLASS' AS word
  UNION ALL SELECT 103 AS no, DATE '2027-01-23' AS d, 'LOGIN' AS word
  UNION ALL SELECT 104 AS no, DATE '2027-01-24' AS d, 'LAYER' AS word
  UNION ALL SELECT 105 AS no, DATE '2027-01-25' AS d, 'MIXIN' AS word
  UNION ALL SELECT 106 AS no, DATE '2027-01-26' AS d, 'SLEEP' AS word
  UNION ALL SELECT 107 AS no, DATE '2027-01-27' AS d, 'CHAIN' AS word
  UNION ALL SELECT 108 AS no, DATE '2027-01-28' AS d, 'BATCH' AS word
  UNION ALL SELECT 109 AS no, DATE '2027-01-29' AS d, 'INODE' AS word
  UNION ALL SELECT 110 AS no, DATE '2027-01-30' AS d, 'COLON' AS word
  UNION ALL SELECT 111 AS no, DATE '2027-01-31' AS d, 'TOKEN' AS word
  UNION ALL SELECT 112 AS no, DATE '2027-02-01' AS d, 'FETCH' AS word
  UNION ALL SELECT 113 AS no, DATE '2027-02-02' AS d, 'NUMPY' AS word
  UNION ALL SELECT 114 AS no, DATE '2027-02-03' AS d, 'PRINT' AS word
  UNION ALL SELECT 115 AS no, DATE '2027-02-04' AS d, 'SLICE' AS word
  UNION ALL SELECT 116 AS no, DATE '2027-02-05' AS d, 'MERGE' AS word
  UNION ALL SELECT 117 AS no, DATE '2027-02-06' AS d, 'DIGIT' AS word
  UNION ALL SELECT 118 AS no, DATE '2027-02-07' AS d, 'VALID' AS word
  UNION ALL SELECT 119 AS no, DATE '2027-02-08' AS d, 'FOCUS' AS word
  UNION ALL SELECT 120 AS no, DATE '2027-02-09' AS d, 'STORE' AS word
  UNION ALL SELECT 121 AS no, DATE '2027-02-10' AS d, 'ROUTE' AS word
  UNION ALL SELECT 122 AS no, DATE '2027-02-11' AS d, 'PROPS' AS word
  UNION ALL SELECT 123 AS no, DATE '2027-02-12' AS d, 'STACK' AS word
  UNION ALL SELECT 124 AS no, DATE '2027-02-13' AS d, 'UNARY' AS word
  UNION ALL SELECT 125 AS no, DATE '2027-02-14' AS d, 'GUARD' AS word
  UNION ALL SELECT 126 AS no, DATE '2027-02-15' AS d, 'OCTAL' AS word
  UNION ALL SELECT 127 AS no, DATE '2027-02-16' AS d, 'TUPLE' AS word
  UNION ALL SELECT 128 AS no, DATE '2027-02-17' AS d, 'QUOTE' AS word
  UNION ALL SELECT 129 AS no, DATE '2027-02-18' AS d, 'QUEUE' AS word
  UNION ALL SELECT 130 AS no, DATE '2027-02-19' AS d, 'ADMIN' AS word
  UNION ALL SELECT 131 AS no, DATE '2027-02-20' AS d, 'EMPTY' AS word
  UNION ALL SELECT 132 AS no, DATE '2027-02-21' AS d, 'FINAL' AS word
  UNION ALL SELECT 133 AS no, DATE '2027-02-22' AS d, 'AGENT' AS word
  UNION ALL SELECT 134 AS no, DATE '2027-02-23' AS d, 'REGEX' AS word
  UNION ALL SELECT 135 AS no, DATE '2027-02-24' AS d, 'ROUND' AS word
  UNION ALL SELECT 136 AS no, DATE '2027-02-25' AS d, 'CODEC' AS word
  UNION ALL SELECT 137 AS no, DATE '2027-02-26' AS d, 'SETUP' AS word
  UNION ALL SELECT 138 AS no, DATE '2027-02-27' AS d, 'FATAL' AS word
  UNION ALL SELECT 139 AS no, DATE '2027-02-28' AS d, 'DEBUG' AS word
  UNION ALL SELECT 140 AS no, DATE '2027-03-01' AS d, 'VALUE' AS word
  UNION ALL SELECT 141 AS no, DATE '2027-03-02' AS d, 'MOUNT' AS word
  UNION ALL SELECT 142 AS no, DATE '2027-03-03' AS d, 'QUERY' AS word
  UNION ALL SELECT 143 AS no, DATE '2027-03-04' AS d, 'MONAD' AS word
  UNION ALL SELECT 144 AS no, DATE '2027-03-05' AS d, 'INPUT' AS word
  UNION ALL SELECT 145 AS no, DATE '2027-03-06' AS d, 'CHUNK' AS word
  UNION ALL SELECT 146 AS no, DATE '2027-03-07' AS d, 'FRAME' AS word
  UNION ALL SELECT 147 AS no, DATE '2027-03-08' AS d, 'PRUNE' AS word
  UNION ALL SELECT 148 AS no, DATE '2027-03-09' AS d, 'COUNT' AS word
  UNION ALL SELECT 149 AS no, DATE '2027-03-10' AS d, 'DEFER' AS word
  UNION ALL SELECT 150 AS no, DATE '2027-03-11' AS d, 'DELTA' AS word
  UNION ALL SELECT 151 AS no, DATE '2027-03-12' AS d, 'ARRAY' AS word
  UNION ALL SELECT 152 AS no, DATE '2027-03-13' AS d, 'PIXEL' AS word
  UNION ALL SELECT 153 AS no, DATE '2027-03-14' AS d, 'INFIX' AS word
  UNION ALL SELECT 154 AS no, DATE '2027-03-15' AS d, 'FIRST' AS word
  UNION ALL SELECT 155 AS no, DATE '2027-03-16' AS d, 'FALSE' AS word
  UNION ALL SELECT 156 AS no, DATE '2027-03-17' AS d, 'YIELD' AS word
  UNION ALL SELECT 157 AS no, DATE '2027-03-18' AS d, 'REACT' AS word
  UNION ALL SELECT 158 AS no, DATE '2027-03-19' AS d, 'INDEX' AS word
  UNION ALL SELECT 159 AS no, DATE '2027-03-20' AS d, 'FIELD' AS word
  UNION ALL SELECT 160 AS no, DATE '2027-03-21' AS d, 'PROXY' AS word
  UNION ALL SELECT 161 AS no, DATE '2027-03-22' AS d, 'ASYNC' AS word
  UNION ALL SELECT 162 AS no, DATE '2027-03-23' AS d, 'SHAPE' AS word
  UNION ALL SELECT 163 AS no, DATE '2027-03-24' AS d, 'PATCH' AS word
  UNION ALL SELECT 164 AS no, DATE '2027-03-25' AS d, 'UNION' AS word
  UNION ALL SELECT 165 AS no, DATE '2027-03-26' AS d, 'CLONE' AS word
  UNION ALL SELECT 166 AS no, DATE '2027-03-27' AS d, 'LEXER' AS word
  UNION ALL SELECT 167 AS no, DATE '2027-03-28' AS d, 'STASH' AS word
  UNION ALL SELECT 168 AS no, DATE '2027-03-29' AS d, 'SPAWN' AS word
  UNION ALL SELECT 169 AS no, DATE '2027-03-30' AS d, 'CRASH' AS word
  UNION ALL SELECT 170 AS no, DATE '2027-03-31' AS d, 'AWAIT' AS word
  UNION ALL SELECT 171 AS no, DATE '2027-04-01' AS d, 'DEPTH' AS word
  UNION ALL SELECT 172 AS no, DATE '2027-04-02' AS d, 'BREAK' AS word
  UNION ALL SELECT 173 AS no, DATE '2027-04-03' AS d, 'ALIAS' AS word
  UNION ALL SELECT 174 AS no, DATE '2027-04-04' AS d, 'EMAIL' AS word
  UNION ALL SELECT 175 AS no, DATE '2027-04-05' AS d, 'BUILD' AS word
  UNION ALL SELECT 176 AS no, DATE '2027-04-06' AS d, 'CONST' AS word
  UNION ALL SELECT 177 AS no, DATE '2027-04-07' AS d, 'WATCH' AS word
  UNION ALL SELECT 178 AS no, DATE '2027-04-08' AS d, 'PARSE' AS word
  UNION ALL SELECT 179 AS no, DATE '2027-04-09' AS d, 'SUPER' AS word
  UNION ALL SELECT 180 AS no, DATE '2027-04-10' AS d, 'ASCII' AS word
  UNION ALL SELECT 181 AS no, DATE '2027-04-11' AS d, 'SLASH' AS word
  UNION ALL SELECT 182 AS no, DATE '2027-04-12' AS d, 'THROW' AS word
  UNION ALL SELECT 183 AS no, DATE '2027-04-13' AS d, 'SIEVE' AS word
  UNION ALL SELECT 184 AS no, DATE '2027-04-14' AS d, 'ERROR' AS word
  UNION ALL SELECT 185 AS no, DATE '2027-04-15' AS d, 'RAISE' AS word
  UNION ALL SELECT 186 AS no, DATE '2027-04-16' AS d, 'BYTES' AS word
  UNION ALL SELECT 187 AS no, DATE '2027-04-17' AS d, 'COMMA' AS word
  UNION ALL SELECT 188 AS no, DATE '2027-04-18' AS d, 'RESET' AS word
  UNION ALL SELECT 189 AS no, DATE '2027-04-19' AS d, 'MODEL' AS word
  UNION ALL SELECT 190 AS no, DATE '2027-04-20' AS d, 'REDIS' AS word
  UNION ALL SELECT 191 AS no, DATE '2027-04-21' AS d, 'UNZIP' AS word
  UNION ALL SELECT 192 AS no, DATE '2027-04-22' AS d, 'LIMIT' AS word
  UNION ALL SELECT 193 AS no, DATE '2027-04-23' AS d, 'EVENT' AS word
  UNION ALL SELECT 194 AS no, DATE '2027-04-24' AS d, 'EPOCH' AS word
  UNION ALL SELECT 195 AS no, DATE '2027-04-25' AS d, 'TABLE' AS word
  UNION ALL SELECT 196 AS no, DATE '2027-04-26' AS d, 'TIMER' AS word
  UNION ALL SELECT 197 AS no, DATE '2027-04-27' AS d, 'PANIC' AS word
  UNION ALL SELECT 198 AS no, DATE '2027-04-28' AS d, 'INNER' AS word
  UNION ALL SELECT 199 AS no, DATE '2027-04-29' AS d, 'ABORT' AS word
  UNION ALL SELECT 200 AS no, DATE '2027-04-30' AS d, 'UMASK' AS word
  UNION ALL SELECT 201 AS no, DATE '2027-05-01' AS d, 'CYCLE' AS word
  UNION ALL SELECT 202 AS no, DATE '2027-05-02' AS d, 'TOPIC' AS word
  UNION ALL SELECT 203 AS no, DATE '2027-05-03' AS d, 'MACRO' AS word
  UNION ALL SELECT 204 AS no, DATE '2027-05-04' AS d, 'MUTEX' AS word
  UNION ALL SELECT 205 AS no, DATE '2027-05-05' AS d, 'AUDIT' AS word
  UNION ALL SELECT 206 AS no, DATE '2027-05-06' AS d, 'SCRUM' AS word
  UNION ALL SELECT 207 AS no, DATE '2027-05-07' AS d, 'SPLIT' AS word
  UNION ALL SELECT 208 AS no, DATE '2027-05-08' AS d, 'EMBED' AS word
  UNION ALL SELECT 209 AS no, DATE '2027-05-09' AS d, 'FLUSH' AS word
  UNION ALL SELECT 210 AS no, DATE '2027-05-10' AS d, 'POINT' AS word
  UNION ALL SELECT 211 AS no, DATE '2027-05-11' AS d, 'RANGE' AS word
  UNION ALL SELECT 212 AS no, DATE '2027-05-12' AS d, 'TILDE' AS word
  UNION ALL SELECT 213 AS no, DATE '2027-05-13' AS d, 'SCOPE' AS word
  UNION ALL SELECT 214 AS no, DATE '2027-05-14' AS d, 'TOUCH' AS word
  UNION ALL SELECT 215 AS no, DATE '2027-05-15' AS d, 'HELLO' AS word
  UNION ALL SELECT 216 AS no, DATE '2027-05-16' AS d, 'BLOCK' AS word
  UNION ALL SELECT 217 AS no, DATE '2027-05-17' AS d, 'BOUND' AS word
  UNION ALL SELECT 218 AS no, DATE '2027-05-18' AS d, 'SCALE' AS word
  UNION ALL SELECT 219 AS no, DATE '2027-05-19' AS d, 'WRITE' AS word
  UNION ALL SELECT 220 AS no, DATE '2027-05-20' AS d, 'EQUAL' AS word
  UNION ALL SELECT 221 AS no, DATE '2027-05-21' AS d, 'LOGIC' AS word
  UNION ALL SELECT 222 AS no, DATE '2027-05-22' AS d, 'LABEL' AS word
  UNION ALL SELECT 223 AS no, DATE '2027-05-23' AS d, 'WHILE' AS word
  UNION ALL SELECT 224 AS no, DATE '2027-05-24' AS d, 'OUTER' AS word
  UNION ALL SELECT 225 AS no, DATE '2027-05-25' AS d, 'HTTPS' AS word
  UNION ALL SELECT 226 AS no, DATE '2027-05-26' AS d, 'LINUX' AS word
  UNION ALL SELECT 227 AS no, DATE '2027-05-27' AS d, 'STATE' AS word
  UNION ALL SELECT 228 AS no, DATE '2027-05-28' AS d, 'IMAGE' AS word
  UNION ALL SELECT 229 AS no, DATE '2027-05-29' AS d, 'XPATH' AS word
  UNION ALL SELECT 230 AS no, DATE '2027-05-30' AS d, 'RADIX' AS word
  UNION ALL SELECT 231 AS no, DATE '2027-05-31' AS d, 'TRACE' AS word
  UNION ALL SELECT 232 AS no, DATE '2027-06-01' AS d, 'ENTRY' AS word
  UNION ALL SELECT 233 AS no, DATE '2027-06-02' AS d, 'CACHE' AS word
  UNION ALL SELECT 234 AS no, DATE '2027-06-03' AS d, 'RETRY' AS word
  UNION ALL SELECT 235 AS no, DATE '2027-06-04' AS d, 'PRIME' AS word
  UNION ALL SELECT 236 AS no, DATE '2027-06-05' AS d, 'LOCAL' AS word
  UNION ALL SELECT 237 AS no, DATE '2027-06-06' AS d, 'GRAPH' AS word
  UNION ALL SELECT 238 AS no, DATE '2027-06-07' AS d, 'CATCH' AS word
  UNION ALL SELECT 239 AS no, DATE '2027-06-08' AS d, 'SHIFT' AS word
  UNION ALL SELECT 240 AS no, DATE '2027-06-09' AS d, 'POSIX' AS word
  UNION ALL SELECT 241 AS no, DATE '2027-06-10' AS d, 'STRIP' AS word
  UNION ALL SELECT 242 AS no, DATE '2027-06-11' AS d, 'SOLID' AS word
  UNION ALL SELECT 243 AS no, DATE '2027-06-12' AS d, 'STDIN' AS word
  UNION ALL SELECT 244 AS no, DATE '2027-06-13' AS d, 'LOWER' AS word
  UNION ALL SELECT 245 AS no, DATE '2027-06-14' AS d, 'TRAIT' AS word
  UNION ALL SELECT 246 AS no, DATE '2027-06-15' AS d, 'BRACE' AS word
  UNION ALL SELECT 247 AS no, DATE '2027-06-16' AS d, 'FLOAT' AS word
  UNION ALL SELECT 248 AS no, DATE '2027-06-17' AS d, 'STYLE' AS word
  UNION ALL SELECT 249 AS no, DATE '2027-06-18' AS d, 'TRUNK' AS word
  UNION ALL SELECT 250 AS no, DATE '2027-06-19' AS d, 'QUINE' AS word
  UNION ALL SELECT 251 AS no, DATE '2027-06-20' AS d, 'LEVEL' AS word
  UNION ALL SELECT 252 AS no, DATE '2027-06-21' AS d, 'CHMOD' AS word
  UNION ALL SELECT 253 AS no, DATE '2027-06-22' AS d, 'NONCE' AS word
  UNION ALL SELECT 254 AS no, DATE '2027-06-23' AS d, 'SHARD' AS word
  UNION ALL SELECT 255 AS no, DATE '2027-06-24' AS d, 'OCTET' AS word
  UNION ALL SELECT 256 AS no, DATE '2027-06-25' AS d, 'MATCH' AS word
  UNION ALL SELECT 257 AS no, DATE '2027-06-26' AS d, 'SHELL' AS word
  UNION ALL SELECT 258 AS no, DATE '2027-06-27' AS d, 'UPPER' AS word
  UNION ALL SELECT 259 AS no, DATE '2027-06-28' AS d, 'WIDTH' AS word
  UNION ALL SELECT 260 AS no, DATE '2027-06-29' AS d, 'CHILD' AS word
  UNION ALL SELECT 261 AS no, DATE '2027-06-30' AS d, 'CLASS' AS word
  UNION ALL SELECT 262 AS no, DATE '2027-07-01' AS d, 'LOGIN' AS word
  UNION ALL SELECT 263 AS no, DATE '2027-07-02' AS d, 'LAYER' AS word
  UNION ALL SELECT 264 AS no, DATE '2027-07-03' AS d, 'MIXIN' AS word
  UNION ALL SELECT 265 AS no, DATE '2027-07-04' AS d, 'SLEEP' AS word
  UNION ALL SELECT 266 AS no, DATE '2027-07-05' AS d, 'CHAIN' AS word
  UNION ALL SELECT 267 AS no, DATE '2027-07-06' AS d, 'BATCH' AS word
  UNION ALL SELECT 268 AS no, DATE '2027-07-07' AS d, 'INODE' AS word
  UNION ALL SELECT 269 AS no, DATE '2027-07-08' AS d, 'COLON' AS word
  UNION ALL SELECT 270 AS no, DATE '2027-07-09' AS d, 'TOKEN' AS word
  UNION ALL SELECT 271 AS no, DATE '2027-07-10' AS d, 'FETCH' AS word
  UNION ALL SELECT 272 AS no, DATE '2027-07-11' AS d, 'NUMPY' AS word
  UNION ALL SELECT 273 AS no, DATE '2027-07-12' AS d, 'PRINT' AS word
  UNION ALL SELECT 274 AS no, DATE '2027-07-13' AS d, 'SLICE' AS word
  UNION ALL SELECT 275 AS no, DATE '2027-07-14' AS d, 'MERGE' AS word
  UNION ALL SELECT 276 AS no, DATE '2027-07-15' AS d, 'DIGIT' AS word
  UNION ALL SELECT 277 AS no, DATE '2027-07-16' AS d, 'VALID' AS word
  UNION ALL SELECT 278 AS no, DATE '2027-07-17' AS d, 'FOCUS' AS word
  UNION ALL SELECT 279 AS no, DATE '2027-07-18' AS d, 'STORE' AS word
  UNION ALL SELECT 280 AS no, DATE '2027-07-19' AS d, 'ROUTE' AS word
  UNION ALL SELECT 281 AS no, DATE '2027-07-20' AS d, 'PROPS' AS word
  UNION ALL SELECT 282 AS no, DATE '2027-07-21' AS d, 'STACK' AS word
  UNION ALL SELECT 283 AS no, DATE '2027-07-22' AS d, 'UNARY' AS word
  UNION ALL SELECT 284 AS no, DATE '2027-07-23' AS d, 'GUARD' AS word
  UNION ALL SELECT 285 AS no, DATE '2027-07-24' AS d, 'OCTAL' AS word
  UNION ALL SELECT 286 AS no, DATE '2027-07-25' AS d, 'TUPLE' AS word
  UNION ALL SELECT 287 AS no, DATE '2027-07-26' AS d, 'QUOTE' AS word
  UNION ALL SELECT 288 AS no, DATE '2027-07-27' AS d, 'QUEUE' AS word
  UNION ALL SELECT 289 AS no, DATE '2027-07-28' AS d, 'ADMIN' AS word
  UNION ALL SELECT 290 AS no, DATE '2027-07-29' AS d, 'EMPTY' AS word
  UNION ALL SELECT 291 AS no, DATE '2027-07-30' AS d, 'FINAL' AS word
  UNION ALL SELECT 292 AS no, DATE '2027-07-31' AS d, 'AGENT' AS word
  UNION ALL SELECT 293 AS no, DATE '2027-08-01' AS d, 'REGEX' AS word
  UNION ALL SELECT 294 AS no, DATE '2027-08-02' AS d, 'ROUND' AS word
  UNION ALL SELECT 295 AS no, DATE '2027-08-03' AS d, 'CODEC' AS word
  UNION ALL SELECT 296 AS no, DATE '2027-08-04' AS d, 'SETUP' AS word
  UNION ALL SELECT 297 AS no, DATE '2027-08-05' AS d, 'FATAL' AS word
  UNION ALL SELECT 298 AS no, DATE '2027-08-06' AS d, 'DEBUG' AS word
  UNION ALL SELECT 299 AS no, DATE '2027-08-07' AS d, 'VALUE' AS word
  UNION ALL SELECT 300 AS no, DATE '2027-08-08' AS d, 'MOUNT' AS word
  UNION ALL SELECT 301 AS no, DATE '2027-08-09' AS d, 'QUERY' AS word
  UNION ALL SELECT 302 AS no, DATE '2027-08-10' AS d, 'MONAD' AS word
  UNION ALL SELECT 303 AS no, DATE '2027-08-11' AS d, 'INPUT' AS word
  UNION ALL SELECT 304 AS no, DATE '2027-08-12' AS d, 'CHUNK' AS word
  UNION ALL SELECT 305 AS no, DATE '2027-08-13' AS d, 'FRAME' AS word
  UNION ALL SELECT 306 AS no, DATE '2027-08-14' AS d, 'PRUNE' AS word
  UNION ALL SELECT 307 AS no, DATE '2027-08-15' AS d, 'COUNT' AS word
  UNION ALL SELECT 308 AS no, DATE '2027-08-16' AS d, 'DEFER' AS word
  UNION ALL SELECT 309 AS no, DATE '2027-08-17' AS d, 'DELTA' AS word
  UNION ALL SELECT 310 AS no, DATE '2027-08-18' AS d, 'ARRAY' AS word
  UNION ALL SELECT 311 AS no, DATE '2027-08-19' AS d, 'PIXEL' AS word
  UNION ALL SELECT 312 AS no, DATE '2027-08-20' AS d, 'INFIX' AS word
  UNION ALL SELECT 313 AS no, DATE '2027-08-21' AS d, 'FIRST' AS word
  UNION ALL SELECT 314 AS no, DATE '2027-08-22' AS d, 'FALSE' AS word
  UNION ALL SELECT 315 AS no, DATE '2027-08-23' AS d, 'YIELD' AS word
  UNION ALL SELECT 316 AS no, DATE '2027-08-24' AS d, 'REACT' AS word
  UNION ALL SELECT 317 AS no, DATE '2027-08-25' AS d, 'INDEX' AS word
  UNION ALL SELECT 318 AS no, DATE '2027-08-26' AS d, 'FIELD' AS word
  UNION ALL SELECT 319 AS no, DATE '2027-08-27' AS d, 'PROXY' AS word
  UNION ALL SELECT 320 AS no, DATE '2027-08-28' AS d, 'ASYNC' AS word
  UNION ALL SELECT 321 AS no, DATE '2027-08-29' AS d, 'SHAPE' AS word
  UNION ALL SELECT 322 AS no, DATE '2027-08-30' AS d, 'PATCH' AS word
  UNION ALL SELECT 323 AS no, DATE '2027-08-31' AS d, 'UNION' AS word
  UNION ALL SELECT 324 AS no, DATE '2027-09-01' AS d, 'CLONE' AS word
  UNION ALL SELECT 325 AS no, DATE '2027-09-02' AS d, 'LEXER' AS word
  UNION ALL SELECT 326 AS no, DATE '2027-09-03' AS d, 'STASH' AS word
  UNION ALL SELECT 327 AS no, DATE '2027-09-04' AS d, 'SPAWN' AS word
  UNION ALL SELECT 328 AS no, DATE '2027-09-05' AS d, 'CRASH' AS word
  UNION ALL SELECT 329 AS no, DATE '2027-09-06' AS d, 'AWAIT' AS word
  UNION ALL SELECT 330 AS no, DATE '2027-09-07' AS d, 'DEPTH' AS word
  UNION ALL SELECT 331 AS no, DATE '2027-09-08' AS d, 'BREAK' AS word
  UNION ALL SELECT 332 AS no, DATE '2027-09-09' AS d, 'ALIAS' AS word
  UNION ALL SELECT 333 AS no, DATE '2027-09-10' AS d, 'EMAIL' AS word
  UNION ALL SELECT 334 AS no, DATE '2027-09-11' AS d, 'BUILD' AS word
  UNION ALL SELECT 335 AS no, DATE '2027-09-12' AS d, 'CONST' AS word
  UNION ALL SELECT 336 AS no, DATE '2027-09-13' AS d, 'WATCH' AS word
  UNION ALL SELECT 337 AS no, DATE '2027-09-14' AS d, 'PARSE' AS word
  UNION ALL SELECT 338 AS no, DATE '2027-09-15' AS d, 'SUPER' AS word
  UNION ALL SELECT 339 AS no, DATE '2027-09-16' AS d, 'ASCII' AS word
  UNION ALL SELECT 340 AS no, DATE '2027-09-17' AS d, 'SLASH' AS word
  UNION ALL SELECT 341 AS no, DATE '2027-09-18' AS d, 'THROW' AS word
  UNION ALL SELECT 342 AS no, DATE '2027-09-19' AS d, 'SIEVE' AS word
  UNION ALL SELECT 343 AS no, DATE '2027-09-20' AS d, 'ERROR' AS word
  UNION ALL SELECT 344 AS no, DATE '2027-09-21' AS d, 'RAISE' AS word
  UNION ALL SELECT 345 AS no, DATE '2027-09-22' AS d, 'BYTES' AS word
  UNION ALL SELECT 346 AS no, DATE '2027-09-23' AS d, 'COMMA' AS word
  UNION ALL SELECT 347 AS no, DATE '2027-09-24' AS d, 'RESET' AS word
  UNION ALL SELECT 348 AS no, DATE '2027-09-25' AS d, 'MODEL' AS word
  UNION ALL SELECT 349 AS no, DATE '2027-09-26' AS d, 'REDIS' AS word
  UNION ALL SELECT 350 AS no, DATE '2027-09-27' AS d, 'UNZIP' AS word
  UNION ALL SELECT 351 AS no, DATE '2027-09-28' AS d, 'LIMIT' AS word
  UNION ALL SELECT 352 AS no, DATE '2027-09-29' AS d, 'EVENT' AS word
  UNION ALL SELECT 353 AS no, DATE '2027-09-30' AS d, 'EPOCH' AS word
  UNION ALL SELECT 354 AS no, DATE '2027-10-01' AS d, 'TABLE' AS word
  UNION ALL SELECT 355 AS no, DATE '2027-10-02' AS d, 'TIMER' AS word
  UNION ALL SELECT 356 AS no, DATE '2027-10-03' AS d, 'PANIC' AS word
  UNION ALL SELECT 357 AS no, DATE '2027-10-04' AS d, 'INNER' AS word
  UNION ALL SELECT 358 AS no, DATE '2027-10-05' AS d, 'ABORT' AS word
  UNION ALL SELECT 359 AS no, DATE '2027-10-06' AS d, 'UMASK' AS word
  UNION ALL SELECT 360 AS no, DATE '2027-10-07' AS d, 'CYCLE' AS word
  UNION ALL SELECT 361 AS no, DATE '2027-10-08' AS d, 'TOPIC' AS word
  UNION ALL SELECT 362 AS no, DATE '2027-10-09' AS d, 'MACRO' AS word
  UNION ALL SELECT 363 AS no, DATE '2027-10-10' AS d, 'MUTEX' AS word
  UNION ALL SELECT 364 AS no, DATE '2027-10-11' AS d, 'AUDIT' AS word
  UNION ALL SELECT 365 AS no, DATE '2027-10-12' AS d, 'SCRUM' AS word
) p JOIN wordle_words w ON w.word = p.word;

-- Programming history games (from js/history-data.js)
INSERT INTO history_cards (name, year, category, fact, source_url) VALUES
  ('Fortran', 1957, 'lang', 'IBM''s Fortran was the first widely used high-level programming language.', 'https://en.wikipedia.org/wiki/Fortran'),
  ('Lisp', 1958, 'lang', 'John McCarthy''s Lisp is the second-oldest high-level language still in common use.', 'https://en.wikipedia.org/wiki/Lisp_(programming_language)'),
  ('COBOL', 1959, 'lang', 'COBOL was designed for business data processing and still runs many banking systems.', 'https://en.wikipedia.org/wiki/COBOL'),
  ('BASIC', 1964, 'lang', 'BASIC was created at Dartmouth College so that students outside science could program.', 'https://en.wikipedia.org/wiki/BASIC'),
  ('Pascal', 1970, 'lang', 'Niklaus Wirth designed Pascal to teach structured programming.', 'https://en.wikipedia.org/wiki/Pascal_(programming_language)'),
  ('C', 1972, 'lang', 'Dennis Ritchie created C at Bell Labs, and Unix was soon rewritten in it.', 'https://en.wikipedia.org/wiki/C_(programming_language)'),
  ('C++', 1985, 'lang', 'Bjarne Stroustrup started C++ as "C with Classes" before its first commercial release.', 'https://en.wikipedia.org/wiki/C%2B%2B'),
  ('Perl', 1987, 'lang', 'Larry Wall''s Perl was nicknamed "the duct tape that holds the Internet together".', 'https://en.wikipedia.org/wiki/Perl'),
  ('Python', 1991, 'lang', 'Python is named after Monty Python''s Flying Circus, not the snake.', 'https://en.wikipedia.org/wiki/Python_(programming_language)'),
  ('Java', 1995, 'lang', 'Java''s slogan was "write once, run anywhere".', 'https://en.wikipedia.org/wiki/Java_(programming_language)'),
  ('JavaScript', 1995, 'lang', 'Brendan Eich wrote the first version of JavaScript in about ten days.', 'https://en.wikipedia.org/wiki/JavaScript'),
  ('PHP', 1995, 'lang', 'PHP began as Rasmus Lerdorf''s "Personal Home Page Tools".', 'https://en.wikipedia.org/wiki/PHP'),
  ('Ruby', 1995, 'lang', 'Yukihiro Matsumoto designed Ruby to make programmers happy.', 'https://en.wikipedia.org/wiki/Ruby_(programming_language)'),
  ('C#', 2000, 'lang', 'C# was Microsoft''s language for .NET, led by Anders Hejlsberg.', 'https://en.wikipedia.org/wiki/C_Sharp_(programming_language)'),
  ('Go', 2009, 'lang', 'Go was designed at Google by Robert Griesemer, Rob Pike and Ken Thompson.', 'https://en.wikipedia.org/wiki/Go_(programming_language)'),
  ('TypeScript', 2012, 'lang', 'TypeScript adds types to JavaScript; Anders Hejlsberg led this one too.', 'https://en.wikipedia.org/wiki/TypeScript'),
  ('Swift', 2014, 'lang', 'Apple introduced Swift as a successor to Objective-C.', 'https://en.wikipedia.org/wiki/Swift_(programming_language)'),
  ('Rust 1.0', 2015, 'lang', 'Rust started as Graydon Hoare''s personal project before Mozilla sponsored it.', 'https://en.wikipedia.org/wiki/Rust_(programming_language)'),
  ('Kotlin 1.0', 2016, 'lang', 'JetBrains made Kotlin; Google later made it the preferred language for Android.', 'https://en.wikipedia.org/wiki/Kotlin_(programming_language)'),
  ('CSS level 1', 1996, 'lang', 'Håkon Wium Lie proposed CSS in 1994; CSS1 became a W3C Recommendation in 1996.', 'https://en.wikipedia.org/wiki/CSS'),
  ('HTML5', 2014, 'lang', 'HTML5 became a W3C Recommendation in October 2014.', 'https://en.wikipedia.org/wiki/HTML5'),
  ('Zuse Z3', 1941, 'hw', 'Konrad Zuse''s Z3 in Berlin was the first working programmable, fully automatic digital computer.', 'https://en.wikipedia.org/wiki/Z3_(computer)'),
  ('ENIAC unveiled', 1946, 'hw', 'ENIAC was programmed by setting switches and plugging cables, not by typing code.', 'https://en.wikipedia.org/wiki/ENIAC'),
  ('The transistor', 1947, 'hw', 'Bardeen, Brattain and Shockley built the first transistor at Bell Labs.', 'https://en.wikipedia.org/wiki/Transistor'),
  ('Intel 4004', 1971, 'hw', 'The Intel 4004 was the first commercially available single-chip microprocessor.', 'https://en.wikipedia.org/wiki/Intel_4004'),
  ('Apple I', 1976, 'hw', 'Steve Wozniak hand-built the Apple I; it sold for $666.66.', 'https://en.wikipedia.org/wiki/Apple_I'),
  ('IBM PC', 1981, 'hw', 'The IBM PC (model 5150) set the standard that most desktop PCs still follow.', 'https://en.wikipedia.org/wiki/IBM_Personal_Computer'),
  ('Apple Macintosh', 1984, 'hw', 'The Macintosh launched with a famous "1984" Super Bowl advert.', 'https://en.wikipedia.org/wiki/Macintosh_128K'),
  ('iPhone announced', 2007, 'hw', 'Steve Jobs announced the first iPhone in January 2007.', 'https://en.wikipedia.org/wiki/IPhone_(1st_generation)'),
  ('Raspberry Pi', 2012, 'hw', 'The Raspberry Pi was made to help teach computing in schools.', 'https://en.wikipedia.org/wiki/Raspberry_Pi'),
  ('First ARPANET message', 1969, 'web', 'Only "LO" arrived before the system crashed; they were typing LOGIN.', 'https://en.wikipedia.org/wiki/ARPANET'),
  ('Email with @', 1971, 'web', 'Ray Tomlinson chose @ to separate the user from the host computer.', 'https://en.wikipedia.org/wiki/Ray_Tomlinson'),
  ('World Wide Web proposal', 1989, 'web', 'Tim Berners-Lee''s boss wrote "Vague but exciting" on the proposal.', 'https://en.wikipedia.org/wiki/World_Wide_Web'),
  ('First web browser', 1990, 'web', 'Tim Berners-Lee''s first browser, WorldWideWeb, ran on a NeXT computer.', 'https://en.wikipedia.org/wiki/WorldWideWeb'),
  ('Mosaic browser', 1993, 'web', 'Mosaic made the web popular by showing images inline with text.', 'https://en.wikipedia.org/wiki/Mosaic_(web_browser)'),
  ('Google founded', 1998, 'web', 'Larry Page and Sergey Brin founded Google while PhD students at Stanford.', 'https://en.wikipedia.org/wiki/Google'),
  ('Wikipedia launched', 2001, 'web', 'Wikipedia went online on 15 January 2001.', 'https://en.wikipedia.org/wiki/Wikipedia'),
  ('GitHub launched', 2008, 'web', 'GitHub launched in 2008; Microsoft bought it in 2018.', 'https://en.wikipedia.org/wiki/GitHub'),
  ('Stack Overflow launched', 2008, 'web', 'Jeff Atwood and Joel Spolsky created Stack Overflow.', 'https://en.wikipedia.org/wiki/Stack_Overflow'),
  ('Google Chrome', 2008, 'web', 'Google announced Chrome with a comic book drawn by Scott McCloud.', 'https://en.wikipedia.org/wiki/Google_Chrome'),
  ('Unix', 1969, 'sw', 'Ken Thompson and Dennis Ritchie began Unix at Bell Labs on a PDP-7.', 'https://en.wikipedia.org/wiki/Unix'),
  ('Microsoft founded', 1975, 'sw', 'Bill Gates and Paul Allen founded Microsoft in Albuquerque, New Mexico.', 'https://en.wikipedia.org/wiki/Microsoft'),
  ('Windows 1.0', 1985, 'sw', 'Windows 1.0 ran on top of MS-DOS.', 'https://en.wikipedia.org/wiki/Windows_1.0'),
  ('Linux', 1991, 'sw', 'Linus Torvalds announced Linux as "just a hobby".', 'https://en.wikipedia.org/wiki/Linux'),
  ('Git', 2005, 'sw', 'Linus Torvalds wrote Git to manage the Linux kernel''s source code.', 'https://en.wikipedia.org/wiki/Git'),
  ('jQuery', 2006, 'sw', 'John Resig released jQuery to smooth over differences between browsers.', 'https://en.wikipedia.org/wiki/JQuery'),
  ('Android 1.0', 2008, 'sw', 'The first Android phone was the HTC Dream, also sold as the T-Mobile G1.', 'https://en.wikipedia.org/wiki/Android_(operating_system)'),
  ('Node.js', 2009, 'sw', 'Ryan Dahl created Node.js to run JavaScript outside the browser.', 'https://en.wikipedia.org/wiki/Node.js'),
  ('React', 2013, 'sw', 'Facebook open-sourced React in 2013.', 'https://en.wikipedia.org/wiki/React_(software)'),
  ('Docker', 2013, 'sw', 'Solomon Hykes first showed Docker in a five-minute talk at PyCon.', 'https://en.wikipedia.org/wiki/Docker_(software)'),
  ('Visual Studio Code', 2015, 'sw', 'Microsoft announced VS Code at its Build conference in 2015.', 'https://en.wikipedia.org/wiki/Visual_Studio_Code'),
  ('Ada Lovelace''s algorithm', 1843, 'event', 'Ada Lovelace published an algorithm for a machine that was never built.', 'https://en.wikipedia.org/wiki/Ada_Lovelace'),
  ('Turing''s "On Computable Numbers"', 1936, 'event', 'Alan Turing''s paper introduced what we now call the Turing machine.', 'https://en.wikipedia.org/wiki/Alan_Turing'),
  ('The first "bug" (a moth)', 1947, 'event', 'A real moth was taped into the Harvard Mark II logbook.', 'https://en.wikipedia.org/wiki/Software_bug'),
  ('ASCII published', 1963, 'event', 'ASCII gave each English character a number from 0 to 127.', 'https://en.wikipedia.org/wiki/ASCII'),
  ('Moore''s law', 1965, 'event', 'Gordon Moore predicted the number of transistors on a chip would keep doubling.', 'https://en.wikipedia.org/wiki/Moore%27s_law'),
  ('Apollo 11 Moon landing', 1969, 'event', 'Margaret Hamilton''s team wrote the onboard flight software.', 'https://en.wikipedia.org/wiki/Apollo_11'),
  ('Unicode 1.0', 1991, 'event', 'Unicode set out to give every character in every writing system a number.', 'https://en.wikipedia.org/wiki/Unicode'),
  ('Deep Blue beats Kasparov', 1997, 'event', 'IBM''s Deep Blue beat world chess champion Garry Kasparov in a six-game match.', 'https://en.wikipedia.org/wiki/Deep_Blue_versus_Garry_Kasparov'),
  ('Bitcoin whitepaper', 2008, 'event', 'The paper was published under the name Satoshi Nakamoto.', 'https://en.wikipedia.org/wiki/Bitcoin'),
  ('Pong', 1972, 'game', 'Allan Alcorn built Pong at Atari as a training exercise.', 'https://en.wikipedia.org/wiki/Pong'),
  ('Tetris', 1984, 'game', 'Alexey Pajitnov wrote Tetris in Moscow on a computer with no graphics.', 'https://en.wikipedia.org/wiki/Tetris'),
  ('Doom', 1993, 'game', 'id Software released Doom as shareware.', 'https://en.wikipedia.org/wiki/Doom_(1993_video_game)'),
  ('Minecraft', 2009, 'game', 'Markus "Notch" Persson released the first public version of Minecraft.', 'https://en.wikipedia.org/wiki/Minecraft');

INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('The first actual bug', 1947, 'In September 1947, operators of the Harvard Mark II computer traced a fault to one of its relays. They taped the culprit into the logbook with the note "First actual case of bug being found." Engineers already called faults "bugs", but this page made the word famous. Grace Hopper, who worked on the Mark II, loved telling the story.', 'What did they find stuck in the Harvard Mark II?', 'It was a moth, and the logbook page with the moth is kept at the Smithsonian.', 'https://en.wikipedia.org/wiki/Software_bug#History');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'A moth', 1),
  (@story, 2, 'A mouse', 0),
  (@story, 3, 'A loose screw', 0),
  (@story, 4, 'A spider', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('JavaScript in ten days', 1995, 'In May 1995 Netscape asked Brendan Eich for a scripting language for its browser. He wrote the first version in about ten days. The language was renamed twice before the end of the year, and the final name was chosen partly to ride on the popularity of Java.', 'What was JavaScript''s very first name?', 'It started as Mocha, became LiveScript, and was renamed JavaScript in December 1995.', 'https://en.wikipedia.org/wiki/JavaScript#History');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'Mocha', 1),
  (@story, 2, 'Espresso', 0),
  (@story, 3, 'NetScript', 0),
  (@story, 4, 'Coffee', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('Named after a comedy show', 1991, 'Guido van Rossum started Python as a hobby project over the Christmas holidays of 1989 and released it in 1991. He wanted a short, unique and slightly mysterious name. He was reading the scripts of a BBC comedy series at the time.', 'What is Python named after?', 'The name comes from Monty Python''s Flying Circus, which is why Python docs are full of spam and eggs.', 'https://en.wikipedia.org/wiki/Python_(programming_language)#History');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'Monty Python''s Flying Circus', 1),
  (@story, 2, 'A snake at the Amsterdam zoo', 0),
  (@story, 3, 'A Greek myth', 0),
  (@story, 4, 'Guido''s pet', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('A program for a machine that did not exist', 1843, 'Ada Lovelace translated an article about Charles Babbage''s Analytical Engine and added her own notes, which ended up longer than the article. Her Note G describes, step by step, how the engine could calculate a sequence of numbers. The engine was never built, but Note G is often called the first published computer program.', 'What did Ada Lovelace''s algorithm calculate?', 'Note G computes Bernoulli numbers.', 'https://en.wikipedia.org/wiki/Ada_Lovelace');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'Bernoulli numbers', 1),
  (@story, 2, 'Prime numbers', 0),
  (@story, 3, 'The digits of pi', 0),
  (@story, 4, 'Fibonacci numbers', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('Just a hobby', 1991, 'On 25 August 1991, Linus Torvalds, a student in Helsinki, posted to a Usenet group that he was making a free operating system. He added that it would not be "big and professional like gnu". Linux now runs every Android phone and a large share of the internet''s servers.', 'How did Linus describe his project in that first post?', 'He wrote that it was "just a hobby, won''t be big and professional like gnu".', 'https://en.wikipedia.org/wiki/History_of_Linux');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'Just a hobby', 1),
  (@story, 2, 'The future of computing', 0),
  (@story, 3, 'A school assignment', 0),
  (@story, 4, 'A Windows killer', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('Git was born in a hurry', 2005, 'For years the Linux kernel was developed with a proprietary tool called BitKeeper. In 2005 its free licence for kernel developers was withdrawn. Linus Torvalds started writing his own tool in April, and within days it was managing its own source code.', 'Why did Linus Torvalds write Git?', 'The kernel lost its free BitKeeper licence, so Linus built a replacement: Git.', 'https://en.wikipedia.org/wiki/Git#History');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'BitKeeper''s free licence was withdrawn', 1),
  (@story, 2, 'GitHub asked him to', 0),
  (@story, 3, 'Subversion was shut down', 0),
  (@story, 4, 'He wanted to learn C', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('Hello, world!', 1978, 'Printing "hello, world" became every programmer''s first program thanks to one book. Brian Kernighan had used the phrase in earlier Bell Labs tutorials, and in 1978 he and Dennis Ritchie put it at the start of a book about their language.', 'Which book made "hello, world" famous?', 'Kernighan and Ritchie''s The C Programming Language opens with it.', 'https://en.wikipedia.org/wiki/%22Hello,_World!%22_program');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'The C Programming Language', 1),
  (@story, 2, 'The Art of Computer Programming', 0),
  (@story, 3, 'Clean Code', 0),
  (@story, 4, 'Structure and Interpretation of Computer Programs', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('The code that landed on the Moon', 1969, 'Margaret Hamilton led the MIT team that wrote the onboard flight software for Apollo. During the Apollo 11 landing the guidance computer raised its 1201 and 1202 alarms because it was overloaded. The software was designed for exactly that and kept the landing going.', 'What did the Apollo guidance software do when it was overloaded?', 'It shed low-priority jobs so the landing tasks kept running.', 'https://en.wikipedia.org/wiki/Margaret_Hamilton_(software_engineer)');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'Dropped low-priority tasks and kept the important ones', 1),
  (@story, 2, 'Shut down and handed control to Houston', 0),
  (@story, 3, 'Restarted the whole mission plan', 0),
  (@story, 4, 'Switched to a backup computer', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('Java was almost Oak', 1995, 'James Gosling''s team at Sun Microsystems built a language for small devices. They first named it after a tree that stood outside Gosling''s office. The name was already taken, so after a long brainstorm they picked a word for coffee.', 'What was Java first called?', 'It was called Oak before it became Java.', 'https://en.wikipedia.org/wiki/Java_(programming_language)#History');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'Oak', 1),
  (@story, 2, 'Maple', 0),
  (@story, 3, 'Coffee', 0),
  (@story, 4, 'Sun', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('The first programmers of ENIAC', 1946, 'ENIAC, unveiled in 1946, was programmed by six women: Kathleen McNulty, Jean Jennings, Betty Snyder, Marlyn Wescoff, Frances Bilas and Ruth Lichterman. There were no programming languages and no keyboard to type code on.', 'How was ENIAC programmed?', 'Programs were set up with switches and patch cables, much like an old telephone exchange.', 'https://en.wikipedia.org/wiki/ENIAC');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'By setting switches and plugging cables', 1),
  (@story, 2, 'By typing on a keyboard', 0),
  (@story, 3, 'By speaking commands', 0),
  (@story, 4, 'By drawing on a screen', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('When time began', 1970, 'Unix measures time as the number of seconds since one particular moment. Systems that store that count in a signed 32-bit integer will run out of room on 19 January 2038, a problem known as Y2038.', 'When does Unix time start counting?', 'The Unix epoch is 00:00:00 UTC on 1 January 1970.', 'https://en.wikipedia.org/wiki/Unix_time');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, '1 January 1970', 1),
  (@story, 2, '1 January 1900', 0),
  (@story, 3, '1 January 2000', 0),
  (@story, 4, 'The day Unix was released', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('Talk to the duck', 1999, 'The book The Pragmatic Programmer by Andrew Hunt and David Thomas tells of a programmer who carried a rubber duck. When stuck, he explained his code to it line by line, and often found the bug while doing so.', 'What is "rubber duck debugging"?', 'Explaining code step by step forces you to notice what it really does.', 'https://en.wikipedia.org/wiki/Rubber_duck_debugging');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'Explaining your code out loud, line by line', 1),
  (@story, 2, 'Testing code in a bath', 0),
  (@story, 3, 'Deleting code until it works', 0),
  (@story, 4, 'Asking a colleague to fix it', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('A nanosecond you can hold', 1986, 'Grace Hopper liked to hand out pieces of wire about 30 centimetres long during her talks, including on TV in 1986. Each piece showed how far something travels in one nanosecond, to explain why distance matters inside a computer.', 'What does one of Grace Hopper''s "nanoseconds" measure?', 'Light (and electricity, roughly) travels about 30 cm in a billionth of a second.', 'https://en.wikipedia.org/wiki/Grace_Hopper');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'How far light travels in a nanosecond', 1),
  (@story, 2, 'How long a CPU instruction takes', 0),
  (@story, 3, 'The width of a transistor', 0),
  (@story, 4, 'The length of a punch card', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('The first virus in the wild', 1982, 'Elk Cloner, written by 15-year-old Rich Skrenta, is one of the first computer viruses to spread outside the lab where it was written. It infected Apple II computers, and on every 50th boot it showed a short poem.', 'How did Elk Cloner spread?', 'It copied itself onto floppy disks; email, Wi-Fi and USB came much later.', 'https://en.wikipedia.org/wiki/Elk_Cloner');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'On floppy disks', 1),
  (@story, 2, 'By email', 0),
  (@story, 3, 'Over Wi-Fi', 0),
  (@story, 4, 'Through USB sticks', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('Tetris without graphics', 1984, 'Alexey Pajitnov wrote the first Tetris at the Soviet Academy of Sciences in Moscow. His Elektronika 60 computer could not show graphics at all, so the falling pieces had to be built from something else.', 'What were the first Tetris pieces made of?', 'Each block was drawn with bracket characters on a text-only screen.', 'https://en.wikipedia.org/wiki/Tetris');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'Text characters', 1),
  (@story, 2, 'Pixels', 0),
  (@story, 3, 'Light bulbs', 0),
  (@story, 4, 'Paper cut-outs', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('Lost in unit conversion', 1999, 'NASA''s Mars Climate Orbiter came too close to Mars and was lost. The investigation found that ground software from one team produced results in imperial units, while the spacecraft''s software expected metric units.', 'What caused the loss of the Mars Climate Orbiter?', 'Pound-force seconds were read as newton-seconds.', 'https://en.wikipedia.org/wiki/Mars_Climate_Orbiter');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'Imperial and metric units were mixed up', 1),
  (@story, 2, 'A virus on the ground computers', 0),
  (@story, 3, 'A solar storm', 0),
  (@story, 4, 'A typo in the launch date', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('37 seconds', 1996, 'About 37 seconds after its first launch, the Ariane 5 rocket veered off course and was destroyed. Code reused from Ariane 4 tried to fit a 64-bit floating-point value into a 16-bit integer. Ariane 5 flew faster than Ariane 4, so the number no longer fit.', 'What kind of bug destroyed Ariane 5''s first flight?', 'Converting a too-large 64-bit float into a 16-bit integer overflowed.', 'https://en.wikipedia.org/wiki/Ariane_flight_V88');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'A number conversion overflow', 1),
  (@story, 2, 'A missing semicolon', 0),
  (@story, 3, 'A memory leak', 0),
  (@story, 4, 'A wrong time zone', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('Why email has an @', 1971, 'Ray Tomlinson sent the first email between two different computers on ARPANET. He needed a character to separate the person''s name from the name of their computer and picked one from his keyboard.', 'Why did Ray Tomlinson choose the @ sign?', 'user@host reads as "user at host", and @ was not used in people''s names.', 'https://en.wikipedia.org/wiki/Ray_Tomlinson');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'It means "at" and never appears in names', 1),
  (@story, 2, 'It was the only free key', 0),
  (@story, 3, 'His boss liked it', 0),
  (@story, 4, 'It looked like a little envelope', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('A home page that grew up', 1995, 'Rasmus Lerdorf wrote a few small tools to track visits to his online CV and released them as a package. The language that grew from them is now one of the most used on the web, and its name was later turned into a recursive acronym.', 'What did PHP originally stand for?', 'It began as "Personal Home Page Tools"; today PHP stands for "PHP: Hypertext Preprocessor".', 'https://en.wikipedia.org/wiki/PHP#History');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'Personal Home Page', 1),
  (@story, 2, 'PHP: Hypertext Preprocessor', 0),
  (@story, 3, 'Programmed HTML Pages', 0),
  (@story, 4, 'Public Hosting Protocol', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('The first website is still online', 1991, 'Tim Berners-Lee built the World Wide Web at a physics laboratory near Geneva. The first website explained the web project itself. In 2013 the lab restored it at its original address, info.cern.ch.', 'Where was the World Wide Web invented?', 'Tim Berners-Lee was working at CERN when he invented the web.', 'https://en.wikipedia.org/wiki/History_of_the_World_Wide_Web');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'CERN', 1),
  (@story, 2, 'MIT', 0),
  (@story, 3, 'Stanford', 0),
  (@story, 4, 'Bell Labs', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('Who takes out the garbage?', 1959, 'Many languages free unused memory for you automatically. The idea is older than most programmers'' grandparents: John McCarthy invented it to simplify memory management in his own language.', 'For which language was garbage collection invented?', 'John McCarthy invented garbage collection for Lisp around 1959.', 'https://en.wikipedia.org/wiki/Garbage_collection_(computer_science)');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'Lisp', 1),
  (@story, 2, 'Java', 0),
  (@story, 3, 'Fortran', 0),
  (@story, 4, 'Python', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('Machine beats champion', 1997, 'In May 1997 an IBM computer won a six-game chess match against the reigning world champion. It was the first time a computer beat a world champion in a match under standard tournament conditions.', 'Who did IBM''s Deep Blue beat in 1997?', 'Deep Blue beat Garry Kasparov.', 'https://en.wikipedia.org/wiki/Deep_Blue_versus_Garry_Kasparov');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'Garry Kasparov', 1),
  (@story, 2, 'Magnus Carlsen', 0),
  (@story, 3, 'Bobby Fischer', 0),
  (@story, 4, 'Anatoly Karpov', 0);
INSERT INTO history_stories (title, year, body, question, explanation, source_url) VALUES ('A computer in wartime Berlin', 1941, 'Konrad Zuse completed the Z3 in 1941. It was the world''s first working programmable, fully automatic digital computer. The original machine was destroyed in a bombing raid in 1943; a replica was built in the 1960s.', 'In which city did Konrad Zuse build the Z3?', 'Zuse built the Z3 in Berlin.', 'https://en.wikipedia.org/wiki/Z3_(computer)');
SET @story = LAST_INSERT_ID();
INSERT INTO history_story_options (story_id, position, option_text, is_correct) VALUES
  (@story, 1, 'Berlin', 1),
  (@story, 2, 'London', 0),
  (@story, 3, 'Philadelphia', 0),
  (@story, 4, 'Prague', 0);
