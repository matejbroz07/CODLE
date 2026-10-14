/**
 * Codle — programming history content
 *
 * Used by the "Older or Younger" and "Daily Story" practice games
 * (js/history-games.js). Every entry links a source so facts can be checked;
 * please verify against the source when editing or adding entries.
 *
 * cards:   { name, year, cat, fact, src }  cat: lang | hw | web | sw | event | game
 * stories: { title, year, text, q, options[], answer (index), why, src }
 * Append new stories at the end so past days keep their story.
 */
(function () {
  var W = "https://en.wikipedia.org/wiki/";

  window.CodleHistory = {
    cards: [
      // Languages
      { name: "Fortran", year: 1957, cat: "lang", fact: "IBM's Fortran was the first widely used high-level programming language.", src: W + "Fortran" },
      { name: "Lisp", year: 1958, cat: "lang", fact: "John McCarthy's Lisp is the second-oldest high-level language still in common use.", src: W + "Lisp_(programming_language)" },
      { name: "COBOL", year: 1959, cat: "lang", fact: "COBOL was designed for business data processing and still runs many banking systems.", src: W + "COBOL" },
      { name: "BASIC", year: 1964, cat: "lang", fact: "BASIC was created at Dartmouth College so that students outside science could program.", src: W + "BASIC" },
      { name: "Pascal", year: 1970, cat: "lang", fact: "Niklaus Wirth designed Pascal to teach structured programming.", src: W + "Pascal_(programming_language)" },
      { name: "C", year: 1972, cat: "lang", fact: "Dennis Ritchie created C at Bell Labs, and Unix was soon rewritten in it.", src: W + "C_(programming_language)" },
      { name: "C++", year: 1985, cat: "lang", fact: "Bjarne Stroustrup started C++ as \"C with Classes\" before its first commercial release.", src: W + "C%2B%2B" },
      { name: "Perl", year: 1987, cat: "lang", fact: "Larry Wall's Perl was nicknamed \"the duct tape that holds the Internet together\".", src: W + "Perl" },
      { name: "Python", year: 1991, cat: "lang", fact: "Python is named after Monty Python's Flying Circus, not the snake.", src: W + "Python_(programming_language)" },
      { name: "Java", year: 1995, cat: "lang", fact: "Java's slogan was \"write once, run anywhere\".", src: W + "Java_(programming_language)" },
      { name: "JavaScript", year: 1995, cat: "lang", fact: "Brendan Eich wrote the first version of JavaScript in about ten days.", src: W + "JavaScript" },
      { name: "PHP", year: 1995, cat: "lang", fact: "PHP began as Rasmus Lerdorf's \"Personal Home Page Tools\".", src: W + "PHP" },
      { name: "Ruby", year: 1995, cat: "lang", fact: "Yukihiro Matsumoto designed Ruby to make programmers happy.", src: W + "Ruby_(programming_language)" },
      { name: "C#", year: 2000, cat: "lang", fact: "C# was Microsoft's language for .NET, led by Anders Hejlsberg.", src: W + "C_Sharp_(programming_language)" },
      { name: "Go", year: 2009, cat: "lang", fact: "Go was designed at Google by Robert Griesemer, Rob Pike and Ken Thompson.", src: W + "Go_(programming_language)" },
      { name: "TypeScript", year: 2012, cat: "lang", fact: "TypeScript adds types to JavaScript; Anders Hejlsberg led this one too.", src: W + "TypeScript" },
      { name: "Swift", year: 2014, cat: "lang", fact: "Apple introduced Swift as a successor to Objective-C.", src: W + "Swift_(programming_language)" },
      { name: "Rust 1.0", year: 2015, cat: "lang", fact: "Rust started as Graydon Hoare's personal project before Mozilla sponsored it.", src: W + "Rust_(programming_language)" },
      { name: "Kotlin 1.0", year: 2016, cat: "lang", fact: "JetBrains made Kotlin; Google later made it the preferred language for Android.", src: W + "Kotlin_(programming_language)" },
      { name: "CSS level 1", year: 1996, cat: "lang", fact: "Håkon Wium Lie proposed CSS in 1994; CSS1 became a W3C Recommendation in 1996.", src: W + "CSS" },
      { name: "HTML5", year: 2014, cat: "lang", fact: "HTML5 became a W3C Recommendation in October 2014.", src: W + "HTML5" },

      // Hardware
      { name: "Zuse Z3", year: 1941, cat: "hw", fact: "Konrad Zuse's Z3 in Berlin was the first working programmable, fully automatic digital computer.", src: W + "Z3_(computer)" },
      { name: "ENIAC unveiled", year: 1946, cat: "hw", fact: "ENIAC was programmed by setting switches and plugging cables, not by typing code.", src: W + "ENIAC" },
      { name: "The transistor", year: 1947, cat: "hw", fact: "Bardeen, Brattain and Shockley built the first transistor at Bell Labs.", src: W + "Transistor" },
      { name: "Intel 4004", year: 1971, cat: "hw", fact: "The Intel 4004 was the first commercially available single-chip microprocessor.", src: W + "Intel_4004" },
      { name: "Apple I", year: 1976, cat: "hw", fact: "Steve Wozniak hand-built the Apple I; it sold for $666.66.", src: W + "Apple_I" },
      { name: "IBM PC", year: 1981, cat: "hw", fact: "The IBM PC (model 5150) set the standard that most desktop PCs still follow.", src: W + "IBM_Personal_Computer" },
      { name: "Apple Macintosh", year: 1984, cat: "hw", fact: "The Macintosh launched with a famous \"1984\" Super Bowl advert.", src: W + "Macintosh_128K" },
      { name: "iPhone announced", year: 2007, cat: "hw", fact: "Steve Jobs announced the first iPhone in January 2007.", src: W + "IPhone_(1st_generation)" },
      { name: "Raspberry Pi", year: 2012, cat: "hw", fact: "The Raspberry Pi was made to help teach computing in schools.", src: W + "Raspberry_Pi" },

      // Internet and web
      { name: "First ARPANET message", year: 1969, cat: "web", fact: "Only \"LO\" arrived before the system crashed; they were typing LOGIN.", src: W + "ARPANET" },
      { name: "Email with @", year: 1971, cat: "web", fact: "Ray Tomlinson chose @ to separate the user from the host computer.", src: W + "Ray_Tomlinson" },
      { name: "World Wide Web proposal", year: 1989, cat: "web", fact: "Tim Berners-Lee's boss wrote \"Vague but exciting\" on the proposal.", src: W + "World_Wide_Web" },
      { name: "First web browser", year: 1990, cat: "web", fact: "Tim Berners-Lee's first browser, WorldWideWeb, ran on a NeXT computer.", src: W + "WorldWideWeb" },
      { name: "Mosaic browser", year: 1993, cat: "web", fact: "Mosaic made the web popular by showing images inline with text.", src: W + "Mosaic_(web_browser)" },
      { name: "Google founded", year: 1998, cat: "web", fact: "Larry Page and Sergey Brin founded Google while PhD students at Stanford.", src: W + "Google" },
      { name: "Wikipedia launched", year: 2001, cat: "web", fact: "Wikipedia went online on 15 January 2001.", src: W + "Wikipedia" },
      { name: "GitHub launched", year: 2008, cat: "web", fact: "GitHub launched in 2008; Microsoft bought it in 2018.", src: W + "GitHub" },
      { name: "Stack Overflow launched", year: 2008, cat: "web", fact: "Jeff Atwood and Joel Spolsky created Stack Overflow.", src: W + "Stack_Overflow" },
      { name: "Google Chrome", year: 2008, cat: "web", fact: "Google announced Chrome with a comic book drawn by Scott McCloud.", src: W + "Google_Chrome" },

      // Software and operating systems
      { name: "Unix", year: 1969, cat: "sw", fact: "Ken Thompson and Dennis Ritchie began Unix at Bell Labs on a PDP-7.", src: W + "Unix" },
      { name: "Microsoft founded", year: 1975, cat: "sw", fact: "Bill Gates and Paul Allen founded Microsoft in Albuquerque, New Mexico.", src: W + "Microsoft" },
      { name: "Windows 1.0", year: 1985, cat: "sw", fact: "Windows 1.0 ran on top of MS-DOS.", src: W + "Windows_1.0" },
      { name: "Linux", year: 1991, cat: "sw", fact: "Linus Torvalds announced Linux as \"just a hobby\".", src: W + "Linux" },
      { name: "Git", year: 2005, cat: "sw", fact: "Linus Torvalds wrote Git to manage the Linux kernel's source code.", src: W + "Git" },
      { name: "jQuery", year: 2006, cat: "sw", fact: "John Resig released jQuery to smooth over differences between browsers.", src: W + "JQuery" },
      { name: "Android 1.0", year: 2008, cat: "sw", fact: "The first Android phone was the HTC Dream, also sold as the T-Mobile G1.", src: W + "Android_(operating_system)" },
      { name: "Node.js", year: 2009, cat: "sw", fact: "Ryan Dahl created Node.js to run JavaScript outside the browser.", src: W + "Node.js" },
      { name: "React", year: 2013, cat: "sw", fact: "Facebook open-sourced React in 2013.", src: W + "React_(software)" },
      { name: "Docker", year: 2013, cat: "sw", fact: "Solomon Hykes first showed Docker in a five-minute talk at PyCon.", src: W + "Docker_(software)" },
      { name: "Visual Studio Code", year: 2015, cat: "sw", fact: "Microsoft announced VS Code at its Build conference in 2015.", src: W + "Visual_Studio_Code" },

      // Milestones
      { name: "Ada Lovelace's algorithm", year: 1843, cat: "event", fact: "Ada Lovelace published an algorithm for a machine that was never built.", src: W + "Ada_Lovelace" },
      { name: "Turing's \"On Computable Numbers\"", year: 1936, cat: "event", fact: "Alan Turing's paper introduced what we now call the Turing machine.", src: W + "Alan_Turing" },
      { name: "The first \"bug\" (a moth)", year: 1947, cat: "event", fact: "A real moth was taped into the Harvard Mark II logbook.", src: W + "Software_bug" },
      { name: "ASCII published", year: 1963, cat: "event", fact: "ASCII gave each English character a number from 0 to 127.", src: W + "ASCII" },
      { name: "Moore's law", year: 1965, cat: "event", fact: "Gordon Moore predicted the number of transistors on a chip would keep doubling.", src: W + "Moore%27s_law" },
      { name: "Apollo 11 Moon landing", year: 1969, cat: "event", fact: "Margaret Hamilton's team wrote the onboard flight software.", src: W + "Apollo_11" },
      { name: "Unicode 1.0", year: 1991, cat: "event", fact: "Unicode set out to give every character in every writing system a number.", src: W + "Unicode" },
      { name: "Deep Blue beats Kasparov", year: 1997, cat: "event", fact: "IBM's Deep Blue beat world chess champion Garry Kasparov in a six-game match.", src: W + "Deep_Blue_versus_Garry_Kasparov" },
      { name: "Bitcoin whitepaper", year: 2008, cat: "event", fact: "The paper was published under the name Satoshi Nakamoto.", src: W + "Bitcoin" },

      // Games
      { name: "Pong", year: 1972, cat: "game", fact: "Allan Alcorn built Pong at Atari as a training exercise.", src: W + "Pong" },
      { name: "Tetris", year: 1984, cat: "game", fact: "Alexey Pajitnov wrote Tetris in Moscow on a computer with no graphics.", src: W + "Tetris" },
      { name: "Doom", year: 1993, cat: "game", fact: "id Software released Doom as shareware.", src: W + "Doom_(1993_video_game)" },
      { name: "Minecraft", year: 2009, cat: "game", fact: "Markus \"Notch\" Persson released the first public version of Minecraft.", src: W + "Minecraft" }
    ],

    stories: [
      {
        title: "The first actual bug", year: 1947,
        text: "In September 1947, operators of the Harvard Mark II computer traced a fault to one of its relays. They taped the culprit into the logbook with the note \"First actual case of bug being found.\" Engineers already called faults \"bugs\", but this page made the word famous. Grace Hopper, who worked on the Mark II, loved telling the story.",
        q: "What did they find stuck in the Harvard Mark II?",
        options: ["A moth", "A mouse", "A loose screw", "A spider"], answer: 0,
        why: "It was a moth, and the logbook page with the moth is kept at the Smithsonian.",
        src: W + "Software_bug#History"
      },
      {
        title: "JavaScript in ten days", year: 1995,
        text: "In May 1995 Netscape asked Brendan Eich for a scripting language for its browser. He wrote the first version in about ten days. The language was renamed twice before the end of the year, and the final name was chosen partly to ride on the popularity of Java.",
        q: "What was JavaScript's very first name?",
        options: ["Mocha", "Espresso", "NetScript", "Coffee"], answer: 0,
        why: "It started as Mocha, became LiveScript, and was renamed JavaScript in December 1995.",
        src: W + "JavaScript#History"
      },
      {
        title: "Named after a comedy show", year: 1991,
        text: "Guido van Rossum started Python as a hobby project over the Christmas holidays of 1989 and released it in 1991. He wanted a short, unique and slightly mysterious name. He was reading the scripts of a BBC comedy series at the time.",
        q: "What is Python named after?",
        options: ["Monty Python's Flying Circus", "A snake at the Amsterdam zoo", "A Greek myth", "Guido's pet"], answer: 0,
        why: "The name comes from Monty Python's Flying Circus, which is why Python docs are full of spam and eggs.",
        src: W + "Python_(programming_language)#History"
      },
      {
        title: "A program for a machine that did not exist", year: 1843,
        text: "Ada Lovelace translated an article about Charles Babbage's Analytical Engine and added her own notes, which ended up longer than the article. Her Note G describes, step by step, how the engine could calculate a sequence of numbers. The engine was never built, but Note G is often called the first published computer program.",
        q: "What did Ada Lovelace's algorithm calculate?",
        options: ["Bernoulli numbers", "Prime numbers", "The digits of pi", "Fibonacci numbers"], answer: 0,
        why: "Note G computes Bernoulli numbers.",
        src: W + "Ada_Lovelace"
      },
      {
        title: "Just a hobby", year: 1991,
        text: "On 25 August 1991, Linus Torvalds, a student in Helsinki, posted to a Usenet group that he was making a free operating system. He added that it would not be \"big and professional like gnu\". Linux now runs every Android phone and a large share of the internet's servers.",
        q: "How did Linus describe his project in that first post?",
        options: ["Just a hobby", "The future of computing", "A school assignment", "A Windows killer"], answer: 0,
        why: "He wrote that it was \"just a hobby, won't be big and professional like gnu\".",
        src: W + "History_of_Linux"
      },
      {
        title: "Git was born in a hurry", year: 2005,
        text: "For years the Linux kernel was developed with a proprietary tool called BitKeeper. In 2005 its free licence for kernel developers was withdrawn. Linus Torvalds started writing his own tool in April, and within days it was managing its own source code.",
        q: "Why did Linus Torvalds write Git?",
        options: ["BitKeeper's free licence was withdrawn", "GitHub asked him to", "Subversion was shut down", "He wanted to learn C"], answer: 0,
        why: "The kernel lost its free BitKeeper licence, so Linus built a replacement: Git.",
        src: W + "Git#History"
      },
      {
        title: "Hello, world!", year: 1978,
        text: "Printing \"hello, world\" became every programmer's first program thanks to one book. Brian Kernighan had used the phrase in earlier Bell Labs tutorials, and in 1978 he and Dennis Ritchie put it at the start of a book about their language.",
        q: "Which book made \"hello, world\" famous?",
        options: ["The C Programming Language", "The Art of Computer Programming", "Clean Code", "Structure and Interpretation of Computer Programs"], answer: 0,
        why: "Kernighan and Ritchie's The C Programming Language opens with it.",
        src: W + "%22Hello,_World!%22_program"
      },
      {
        title: "The code that landed on the Moon", year: 1969,
        text: "Margaret Hamilton led the MIT team that wrote the onboard flight software for Apollo. During the Apollo 11 landing the guidance computer raised its 1201 and 1202 alarms because it was overloaded. The software was designed for exactly that and kept the landing going.",
        q: "What did the Apollo guidance software do when it was overloaded?",
        options: ["Dropped low-priority tasks and kept the important ones", "Shut down and handed control to Houston", "Restarted the whole mission plan", "Switched to a backup computer"], answer: 0,
        why: "It shed low-priority jobs so the landing tasks kept running.",
        src: W + "Margaret_Hamilton_(software_engineer)"
      },
      {
        title: "Java was almost Oak", year: 1995,
        text: "James Gosling's team at Sun Microsystems built a language for small devices. They first named it after a tree that stood outside Gosling's office. The name was already taken, so after a long brainstorm they picked a word for coffee.",
        q: "What was Java first called?",
        options: ["Oak", "Maple", "Coffee", "Sun"], answer: 0,
        why: "It was called Oak before it became Java.",
        src: W + "Java_(programming_language)#History"
      },
      {
        title: "The first programmers of ENIAC", year: 1946,
        text: "ENIAC, unveiled in 1946, was programmed by six women: Kathleen McNulty, Jean Jennings, Betty Snyder, Marlyn Wescoff, Frances Bilas and Ruth Lichterman. There were no programming languages and no keyboard to type code on.",
        q: "How was ENIAC programmed?",
        options: ["By setting switches and plugging cables", "By typing on a keyboard", "By speaking commands", "By drawing on a screen"], answer: 0,
        why: "Programs were set up with switches and patch cables, much like an old telephone exchange.",
        src: W + "ENIAC"
      },
      {
        title: "When time began", year: 1970,
        text: "Unix measures time as the number of seconds since one particular moment. Systems that store that count in a signed 32-bit integer will run out of room on 19 January 2038, a problem known as Y2038.",
        q: "When does Unix time start counting?",
        options: ["1 January 1970", "1 January 1900", "1 January 2000", "The day Unix was released"], answer: 0,
        why: "The Unix epoch is 00:00:00 UTC on 1 January 1970.",
        src: W + "Unix_time"
      },
      {
        title: "Talk to the duck", year: 1999,
        text: "The book The Pragmatic Programmer by Andrew Hunt and David Thomas tells of a programmer who carried a rubber duck. When stuck, he explained his code to it line by line, and often found the bug while doing so.",
        q: "What is \"rubber duck debugging\"?",
        options: ["Explaining your code out loud, line by line", "Testing code in a bath", "Deleting code until it works", "Asking a colleague to fix it"], answer: 0,
        why: "Explaining code step by step forces you to notice what it really does.",
        src: W + "Rubber_duck_debugging"
      },
      {
        title: "A nanosecond you can hold", year: 1986,
        text: "Grace Hopper liked to hand out pieces of wire about 30 centimetres long during her talks, including on TV in 1986. Each piece showed how far something travels in one nanosecond, to explain why distance matters inside a computer.",
        q: "What does one of Grace Hopper's \"nanoseconds\" measure?",
        options: ["How far light travels in a nanosecond", "How long a CPU instruction takes", "The width of a transistor", "The length of a punch card"], answer: 0,
        why: "Light (and electricity, roughly) travels about 30 cm in a billionth of a second.",
        src: W + "Grace_Hopper"
      },
      {
        title: "The first virus in the wild", year: 1982,
        text: "Elk Cloner, written by 15-year-old Rich Skrenta, is one of the first computer viruses to spread outside the lab where it was written. It infected Apple II computers, and on every 50th boot it showed a short poem.",
        q: "How did Elk Cloner spread?",
        options: ["On floppy disks", "By email", "Over Wi-Fi", "Through USB sticks"], answer: 0,
        why: "It copied itself onto floppy disks; email, Wi-Fi and USB came much later.",
        src: W + "Elk_Cloner"
      },
      {
        title: "Tetris without graphics", year: 1984,
        text: "Alexey Pajitnov wrote the first Tetris at the Soviet Academy of Sciences in Moscow. His Elektronika 60 computer could not show graphics at all, so the falling pieces had to be built from something else.",
        q: "What were the first Tetris pieces made of?",
        options: ["Text characters", "Pixels", "Light bulbs", "Paper cut-outs"], answer: 0,
        why: "Each block was drawn with bracket characters on a text-only screen.",
        src: W + "Tetris"
      },
      {
        title: "Lost in unit conversion", year: 1999,
        text: "NASA's Mars Climate Orbiter came too close to Mars and was lost. The investigation found that ground software from one team produced results in imperial units, while the spacecraft's software expected metric units.",
        q: "What caused the loss of the Mars Climate Orbiter?",
        options: ["Imperial and metric units were mixed up", "A virus on the ground computers", "A solar storm", "A typo in the launch date"], answer: 0,
        why: "Pound-force seconds were read as newton-seconds.",
        src: W + "Mars_Climate_Orbiter"
      },
      {
        title: "37 seconds", year: 1996,
        text: "About 37 seconds after its first launch, the Ariane 5 rocket veered off course and was destroyed. Code reused from Ariane 4 tried to fit a 64-bit floating-point value into a 16-bit integer. Ariane 5 flew faster than Ariane 4, so the number no longer fit.",
        q: "What kind of bug destroyed Ariane 5's first flight?",
        options: ["A number conversion overflow", "A missing semicolon", "A memory leak", "A wrong time zone"], answer: 0,
        why: "Converting a too-large 64-bit float into a 16-bit integer overflowed.",
        src: W + "Ariane_flight_V88"
      },
      {
        title: "Why email has an @", year: 1971,
        text: "Ray Tomlinson sent the first email between two different computers on ARPANET. He needed a character to separate the person's name from the name of their computer and picked one from his keyboard.",
        q: "Why did Ray Tomlinson choose the @ sign?",
        options: ["It means \"at\" and never appears in names", "It was the only free key", "His boss liked it", "It looked like a little envelope"], answer: 0,
        why: "user@host reads as \"user at host\", and @ was not used in people's names.",
        src: W + "Ray_Tomlinson"
      },
      {
        title: "A home page that grew up", year: 1995,
        text: "Rasmus Lerdorf wrote a few small tools to track visits to his online CV and released them as a package. The language that grew from them is now one of the most used on the web, and its name was later turned into a recursive acronym.",
        q: "What did PHP originally stand for?",
        options: ["Personal Home Page", "PHP: Hypertext Preprocessor", "Programmed HTML Pages", "Public Hosting Protocol"], answer: 0,
        why: "It began as \"Personal Home Page Tools\"; today PHP stands for \"PHP: Hypertext Preprocessor\".",
        src: W + "PHP#History"
      },
      {
        title: "The first website is still online", year: 1991,
        text: "Tim Berners-Lee built the World Wide Web at a physics laboratory near Geneva. The first website explained the web project itself. In 2013 the lab restored it at its original address, info.cern.ch.",
        q: "Where was the World Wide Web invented?",
        options: ["CERN", "MIT", "Stanford", "Bell Labs"], answer: 0,
        why: "Tim Berners-Lee was working at CERN when he invented the web.",
        src: W + "History_of_the_World_Wide_Web"
      },
      {
        title: "Who takes out the garbage?", year: 1959,
        text: "Many languages free unused memory for you automatically. The idea is older than most programmers' grandparents: John McCarthy invented it to simplify memory management in his own language.",
        q: "For which language was garbage collection invented?",
        options: ["Lisp", "Java", "Fortran", "Python"], answer: 0,
        why: "John McCarthy invented garbage collection for Lisp around 1959.",
        src: W + "Garbage_collection_(computer_science)"
      },
      {
        title: "Machine beats champion", year: 1997,
        text: "In May 1997 an IBM computer won a six-game chess match against the reigning world champion. It was the first time a computer beat a world champion in a match under standard tournament conditions.",
        q: "Who did IBM's Deep Blue beat in 1997?",
        options: ["Garry Kasparov", "Magnus Carlsen", "Bobby Fischer", "Anatoly Karpov"], answer: 0,
        why: "Deep Blue beat Garry Kasparov.",
        src: W + "Deep_Blue_versus_Garry_Kasparov"
      },
      {
        title: "A computer in wartime Berlin", year: 1941,
        text: "Konrad Zuse completed the Z3 in 1941. It was the world's first working programmable, fully automatic digital computer. The original machine was destroyed in a bombing raid in 1943; a replica was built in the 1960s.",
        q: "In which city did Konrad Zuse build the Z3?",
        options: ["Berlin", "London", "Philadelphia", "Prague"], answer: 0,
        why: "Zuse built the Z3 in Berlin.",
        src: W + "Z3_(computer)"
      }
    ]
  };
})();
