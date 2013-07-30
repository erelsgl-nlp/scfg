/**
 * RegexpWithNames = a regular expression matcher, where instead of indexed parenthesised groups, you can use named variables.
 *
 * for example, the pattern "I offer a salary of <number> <currency>"
 * matches the string:"I offer a salary of 20000 USD"
 * with the assignments: { '<number>': '20000', '<currency>': 'USD' }
 */



/** 
 * Escape the chars with special regexp-meaning in the given string.
 *
 * See the following stackexchange pages:
 * http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711#3561711
 * http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
 */
RegExp.escape = function(s) {
	return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
};


/**
 * Initialize a RegExp with named variables.
 *
 * @param pattern (string) - a string with some variables, 
 *   for example: "I offer a salary of <number> <currency>"
 * @param mapVariableToRegexp - a hash where the keys are variables, and the values are (usual) regular expressions, 
 *   for example:  {"<number>": "\\d+", "<currency>": "[^ ]*"} 
 */
var RegexpWithNames = function(pattern, mapVariableToRegexp) {
	if (!pattern) throw new Error("null pattern");
	if (!mapVariableToRegexp) throw new Error("null mapVariableToRegexp");
	pattern = RegExp.escape(pattern);

	var variableArray = [];
	for (var variable in mapVariableToRegexp) {
		// look for indexed variables:
		var hasIndexedVariables=false;
		for (var index=1;; index++) {  
			var charIndex = pattern.indexOf(variable+index);
			if (charIndex>=0) {
				variableArray.push({variable: variable+index, regexp: mapVariableToRegexp[variable], charIndex: charIndex});
				hasIndexedVariables = true;
			} else
				break;
		}

		// look for a non-indexed variable:
		if (!hasIndexedVariables) {
			var charIndex = pattern.indexOf(variable);
			if (charIndex>=0)
				variableArray.push({variable: variable, regexp: mapVariableToRegexp[variable], charIndex: charIndex});
		}
	}
	variableArray.sort(function(a,b){return a.charIndex-b.charIndex;}); // sort by increasing index;

	var mapVariableToIndex = {};
	for (var variableIndex=0; variableIndex<variableArray.length; ++variableIndex) {
		var regexp = variableArray[variableIndex].regexp;
		var variable = variableArray[variableIndex].variable;
		variableArray[variableIndex] = variable;   // the charIndex and regexp are  no longer needed
		mapVariableToIndex[variable] = variableIndex;
		var variableDescriptionRegexp = new RegExp(variable,"gi");
		pattern = pattern.replace(variableDescriptionRegexp, "("+regexp+")");
	}
	
	this.variableArray = variableArray;
	this.mapVariableToIndex = mapVariableToIndex;
	
	this.regexp = new RegExp(pattern, "g");  // g means find all matches
}


RegexpWithNames.prototype = {
	/**
	 * Match the given string against the current regexp, and return the mapping of the variables (as a hash).
	 *
	 * @param string a text string.
	 * @return a array of hashes {name1: value1, name2: value2...} where the names are the variables in the pattern.
	 */
	matches: function(string) {
		var assignments = [];
		for (;;) {
			var matches = this.regexp.exec(string);
			if (!matches) break;
			var mapVariableToValue = {};
			for (var variableIndex=0; variableIndex<this.variableArray.length; ++variableIndex) {
				var variable = this.variableArray[variableIndex];
				var value = matches[variableIndex+1];
				mapVariableToValue[variable] = value;
			}
			assignments.push(mapVariableToValue);
		}
		return assignments;
	},
}

/**
 * a convenience method: return a function that matches the text against the given pattern (regular expression with named variables), 
 * and return the assignments to the variables.
 */
RegexpWithNames.matches = function(mapVariableToRegexp) {
	return function(text, pattern) { 
		return new RegexpWithNames(pattern,mapVariableToRegexp).matches(text);
	}
}


module.exports = RegexpWithNames;


// DEMO PROGRAM:
if (process.argv[1] === __filename) {
	console.log("regexp_names.js demo start");
	var variables = {
		"<number>": "\\d+",
		"<currency>": "[^ ]+",
		"<any>": ".+",
	};
	
	console.log("\n regexp with special chars:")
	var nr = new RegexpWithNames("+<number>", variables);
	console.log("single match: "); console.dir(nr.matches("+1")); 
		
	console.log("\n regexp with indexed variables of the same type:")
	var nr = new RegexpWithNames("<number>1+<number>2", variables);
	console.log("single match: "); console.dir(nr.matches("2+1")); 
	
	console.log("\n standard way of using a regexp: compile an object, then match:");
	var nr = new RegexpWithNames("I offer a salary of <number> <currency>", variables);
	console.log("single match: "); console.dir(nr.matches("I offer a salary of 20000 USD")); 
	console.log("no match: ");     console.dir(nr.matches("I offer a company car"));
	console.log("two matches: ");  console.dir(nr.matches("I offer a salary of 20000 USD and I offer a salary of 40000 ILS")); // double match

	console.log("\n alternative way of using a regexp: compile a function, then match:");
	var variablesMatches = RegexpWithNames.matches(variables);
	console.log("single match again: ");  console.dir(variablesMatches("I offer a salary of 20000 USD", "I offer a salary of <number> <currency>"));
	console.log("match anything:");  console.dir(variablesMatches("I offer a salary of 20000 USD", "<any>"));
	console.log("regexp_names.js demo end");
}

