<?php
// Codle content — JavaScript unit quizzes and final exam
// Question: [prompt, [four answers], index of the correct one, code snippet or null]

return [

'unit-1-quiz' => [
  ['What does console.log("Hi") do?', ['Shows a pop-up', 'Prints Hi in the console', 'Writes Hi on the page', 'Saves Hi to a file'], 1, null],
  ['Which keyword declares a value that never changes?', ['let', 'var', 'const', 'fixed'], 2, null],
  ['What is printed?', ['12', '"12"', '7', 'Error'], 2, "const a = 3;\nconst b = 4;\nconsole.log(a + b);"],
  ['What is the type of "42" (with the quotes)?', ['number', 'string', 'boolean', 'text'], 1, null],
  ['What does typeof true give?', ['"true"', '"bool"', '"boolean"', '"number"'], 2, null],
  ['What is 17 % 5?', ['3.4', '2', '3', '12'], 1, null],
  ['What is printed?', ['CODLE', 'codle', 'Codle', '5'], 0, "const name = \"Codle\";\nconsole.log(name.toUpperCase());"],
  ['What is "Hello, " + "Ada" + "!"?', ['Hello, Ada!', 'Hello,Ada!', 'Error', 'Hello, + Ada + !'], 0, null],
],

'unit-2-quiz' => [
  ['When does the code inside a function run?', ['As soon as the page loads', 'When the function is called', 'Only once', 'Never'], 1, null],
  ['What does return do?', ['Prints a value', 'Stops the function and gives a value back to the caller', 'Restarts the function', 'Declares a parameter'], 1, null],
  ['What is printed?', ['12', 'undefined', '3 * 4', 'Error'], 0, "function area(w, h) {\n  return w * h;\n}\nconsole.log(area(3, 4));"],
  ['What is printed?', ['5', 'undefined', 'Error: count is not defined', '0'], 2, "function count() {\n  let count = 5;\n}\ncount();\nconsole.log(count);"],
  ['Which is an arrow function that doubles a number?', ['const double = n => n * 2;', 'function double => n * 2', 'const double = (n) { return n * 2 }', 'double(n) => n * 2'], 0, null],
  ['What is the result of numbers.map(n => n * 2) for [1, 2, 3]?', ['[1, 2, 3, 1, 2, 3]', '[2, 4, 6]', '12', '[1, 4, 9]'], 1, null],
  ['What is printed?', ['1', '2', '0', 'undefined'], 1, "function makeCounter() {\n  let count = 0;\n  return function () {\n    count = count + 1;\n    return count;\n  };\n}\nconst c = makeCounter();\nc();\nconsole.log(c());"],
  ['A variable declared at the top of the file, outside any function, is…', ['local', 'global', 'private', 'static'], 1, null],
],

'unit-3-quiz' => [
  ['What is printed?', ['Warm', 'Cold', 'Nothing', 'Error'], 0, "const temp = 24;\nif (temp > 20) {\n  console.log(\"Warm\");\n} else {\n  console.log(\"Cold\");\n}"],
  ['What does "5" === 5 give?', ['true', 'false', '5', 'Error'], 1, null],
  ['What does "5" == 5 give?', ['true', 'false', '"5"', 'Error'], 0, null],
  ['When is a && b true?', ['When either is true', 'When both are true', 'When a is true', 'Never'], 1, null],
  ['What does !false give?', ['false', 'true', 'undefined', 'Error'], 1, null],
  ['How many times does this print?', ['4', '5', '6', 'Forever'], 1, "for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}"],
  ['What does break do inside a loop?', ['Skips to the next round', 'Leaves the loop immediately', 'Pauses for a second', 'Restarts the loop'], 1, null],
  ['What is wrong with this loop?', ['Nothing', 'It never ends, because n never changes', 'while needs a semicolon', 'n must be a const'], 1, "let n = 1;\nwhile (n < 10) {\n  console.log(n);\n}"],
],

'unit-4-quiz' => [
  ['What is fruits[0] for ["apple", "pear", "plum"]?', ['"apple"', '"pear"', '0', 'undefined'], 0, null],
  ['How do you add "plum" to the end of an array called fruits?', ['fruits.add("plum")', 'fruits.push("plum")', 'fruits += "plum"', 'fruits.append("plum")'], 1, null],
  ['Which method keeps only the items that pass a test?', ['map', 'filter', 'join', 'find'], 1, null],
  ['What does [10, 20, 30].map(n => n / 10) give?', ['[1, 2, 3]', '[10, 20, 30]', '6', '[0.1, 0.2, 0.3]'], 0, null],
  ['How do you read the price of this object?', ['bread->price', 'bread[price]', 'bread.price', 'price(bread)'], 2, "const bread = { name: \"Rye\", price: 45 };"],
  ['What does this refer to inside a method?', ['The page', 'The object the method was called on', 'The function itself', 'The browser window'], 1, null],
  ['What does JSON.parse(text) return?', ['A string', 'A JavaScript object or array built from the text', 'A number', 'true or false'], 1, null],
  ['What is wrong with this JSON?', ['Nothing', 'Keys must be in double quotes', 'Numbers are not allowed', 'It needs a semicolon'], 1, "{ name: \"Rye\", price: 45 }"],
],

'unit-5-quiz' => [
  ['Which call finds the element with id="title"?', ['document.getElementById("title")', 'document.querySelector("title")', 'document.find("#title")', 'document.id("title")'], 0, null],
  ['What does document.querySelectorAll("li") return?', ['The first <li>', 'All <li> elements', 'The number of <li> elements', 'The text of the list'], 1, null],
  ['Which property changes the text of an element (without HTML)?', ['innerHTML', 'textContent', 'text', 'value'], 1, null],
  ['What does this show on the page?', ['<strong>today</strong>', 'today in bold', 'Nothing', 'An error'], 1, "el.innerHTML = \"<strong>today</strong>\";"],
  ['How do you add the class "active" to an element called btn?', ['btn.class = "active"', 'btn.classList.add("active")', 'btn.addClass("active")', 'btn.style.class = "active"'], 1, null],
  ['Which event fires when a button is clicked?', ['"press"', '"tap"', '"click"', '"onclick"'], 2, null],
  ['What does this code do?', ['Runs the function once', 'Runs the function every time the button is clicked', 'Creates a button', 'Clicks the button'], 1, "btn.addEventListener(\"click\", () => {\n  count = count + 1;\n});"],
  ['Which steps create a new <li> and show it in a list?', ['createElement, textContent, appendChild', 'newElement, innerText, add', 'makeElement, text, insert', 'createElement, appendChild, show'], 0, null],
],

'final-exam' => [
  ['What is printed?', ['Hello, Ada!', 'Hello, ${name}!', 'Error', 'Hello, name!'], 0, "const name = \"Ada\";\nconsole.log(`Hello, ${name}!`);"],
  ['What does this line do?', ['Creates an object', 'Copies name and price out of bread into two variables', 'Deletes name and price from bread', 'Compares bread with name and price'], 1, "const { name, price } = bread;"],
  ['What is printed?', ['Ada', 'Grace', '["Grace", "Linus"]', 'Error'], 1, "const [first, second] = [\"Ada\", \"Grace\", \"Linus\"];\nconsole.log(second);"],
  ['What is a promise?', ['A value that is already known', 'A value that will be available later (or fail)', 'A function that runs twice', 'A kind of loop'], 1, null],
  ['Which method runs when a promise succeeds?', ['.then()', '.catch()', '.done()', '.run()'], 0, null],
  ['What is the "await" keyword for?', ['Pausing the browser', 'Waiting for a promise inside an async function', 'Declaring a function', 'Delaying by one second'], 1, null],
  ['What does fetch(url) return?', ['The data as text', 'A promise of a response', 'An object', 'Nothing'], 1, null],
  ['Why is there a second .then() here?', ['fetch needs two steps', 'response.json() is also a promise', 'The first one is a typo', 'To run it twice'], 1, "fetch(url)\n  .then(response => response.json())\n  .then(data => console.log(data));"],
  ['What does typeof null give?', ['"null"', '"undefined"', '"object"', '"none"'], 2, null],
  ['What is printed?', ['1', '2', '3', 'undefined'], 2, "const list = [\"a\", \"b\", \"c\"];\nconsole.log(list.length);"],
  ['Which comparison should you normally use?', ['==', '===', '=', '=>'], 1, null],
  ['What is wrong with this code?', ['Nothing', 'You cannot change a const', 'Strings cannot be stored', 'It needs let name = "Ada" twice'], 1, "const name = \"Ada\";\nname = \"Grace\";"],
],

];
