/**
 * Codle — course outline for the static demo (no API).
 *
 * Mirrors database/seed.sql: three courses, six units each, every unit closed by
 * a quiz and the last one by the final exam. Online, the path comes from the
 * database instead (api/lib/progress.php), so this file only matters on GitHub
 * Pages or when index.html is opened from disk.
 *
 * Lesson entries: [slug, title] with kind "lesson" and 20 XP, or
 * [slug, title, kind, xp] for quizzes (50 XP) and the exam (100 XP).
 */
window.CodleCurriculum = {
  html: {
    name: "HTML",
    units: [
      { title: "First Page", lessons: [
        ["hello-html", "Your First Page"], ["headings", "Headings"], ["paragraphs", "Paragraphs"],
        ["comments", "Comments"], ["unit-1-quiz", "Unit 1 Quiz", "quiz", 50]
      ] },
      { title: "Text & Links", lessons: [
        ["links", "Links"], ["lists", "Lists"], ["emphasis", "Bold & Italic"],
        ["line-breaks", "Line Breaks & Rules"], ["unit-2-quiz", "Unit 2 Quiz", "quiz", 50]
      ] },
      { title: "Images & Media", lessons: [
        ["images", "Images"], ["alt-text", "Alt Text"], ["figures", "Figures & Captions"],
        ["audio-video", "Audio & Video"], ["unit-3-quiz", "Unit 3 Quiz", "quiz", 50]
      ] },
      { title: "Page Structure", lessons: [
        ["document-structure", "Head & Body"], ["semantic-tags", "Semantic Tags"], ["header-footer", "Header & Footer"],
        ["navigation", "Navigation"], ["sections", "Sections & Articles"], ["unit-4-quiz", "Unit 4 Quiz", "quiz", 50]
      ] },
      { title: "Tables & Forms", lessons: [
        ["tables", "Tables"], ["table-headers", "Table Headers"], ["forms", "Forms"],
        ["inputs", "Inputs"], ["buttons-labels", "Buttons & Labels"], ["unit-5-quiz", "Unit 5 Quiz", "quiz", 50]
      ] },
      { title: "Putting It Together", lessons: [
        ["attributes", "Attributes & IDs"], ["classes", "Classes"], ["meta-tags", "Meta Tags"],
        ["accessibility", "Accessibility"], ["final-exam", "Final Exam", "exam", 100]
      ] }
    ]
  },
  css: {
    name: "CSS",
    units: [
      { title: "Selectors & Colors", lessons: [
        ["hello-css", "Your First Style"], ["selectors", "Selectors"], ["colors", "Colors"],
        ["classes-ids", "Classes & IDs"], ["unit-1-quiz", "Unit 1 Quiz", "quiz", 50]
      ] },
      { title: "Text & Fonts", lessons: [
        ["fonts", "Fonts"], ["text-styling", "Text Styling"], ["text-spacing", "Alignment & Spacing"],
        ["web-fonts", "Web Fonts"], ["unit-2-quiz", "Unit 2 Quiz", "quiz", 50]
      ] },
      { title: "The Box Model", lessons: [
        ["box-model", "The Box Model"], ["padding-margin", "Padding & Margin"], ["borders", "Borders"],
        ["width-height", "Width & Height"], ["unit-3-quiz", "Unit 3 Quiz", "quiz", 50]
      ] },
      { title: "Layout", lessons: [
        ["display", "Display"], ["flexbox", "Flexbox"], ["flex-alignment", "Flex Alignment"],
        ["grid", "Grid"], ["positioning", "Positioning"], ["unit-4-quiz", "Unit 4 Quiz", "quiz", 50]
      ] },
      { title: "Responsive Design", lessons: [
        ["units", "Units"], ["media-queries", "Media Queries"], ["mobile-first", "Mobile First"],
        ["responsive-images", "Responsive Images"], ["unit-5-quiz", "Unit 5 Quiz", "quiz", 50]
      ] },
      { title: "Effects & Polish", lessons: [
        ["transitions", "Transitions"], ["transforms", "Transforms"], ["animations", "Animations"],
        ["css-variables", "CSS Variables"], ["final-exam", "Final Exam", "exam", 100]
      ] }
    ]
  },
  javascript: {
    name: "JavaScript",
    units: [
      { title: "JS Basics", lessons: [
        ["console-log", "Console Log"], ["variables", "Variables"], ["data-types", "Data Types"],
        ["operators", "Operators"], ["strings", "Strings"], ["unit-1-quiz", "Unit 1 Quiz", "quiz", 50]
      ] },
      { title: "Functions & Scope", lessons: [
        ["functions", "Functions"], ["parameters", "Parameters & Returns"], ["scope", "Scope"],
        ["arrow-functions", "Arrow Functions"], ["closures", "Closures"], ["unit-2-quiz", "Unit 2 Quiz", "quiz", 50]
      ] },
      { title: "Control Flow", lessons: [
        ["if-else", "If & Else"], ["comparisons", "Comparisons"], ["boolean-logic", "Boolean Logic"],
        ["for-loops", "For Loops"], ["while-loops", "While Loops"], ["unit-3-quiz", "Unit 3 Quiz", "quiz", 50]
      ] },
      { title: "Arrays & Objects", lessons: [
        ["arrays", "Arrays"], ["array-methods", "Array Methods"], ["objects", "Objects"],
        ["json", "JSON"], ["unit-4-quiz", "Unit 4 Quiz", "quiz", 50]
      ] },
      { title: "The DOM", lessons: [
        ["selecting-elements", "Selecting Elements"], ["changing-content", "Changing Content"], ["styles-classes", "Styles & Classes"],
        ["events", "Events"], ["creating-elements", "Creating Elements"], ["unit-5-quiz", "Unit 5 Quiz", "quiz", 50]
      ] },
      { title: "Modern JS", lessons: [
        ["template-literals", "Template Literals"], ["destructuring", "Destructuring"], ["promises", "Promises"],
        ["fetch", "Fetch"], ["final-exam", "Final Exam", "exam", 100]
      ] }
    ]
  }
};
