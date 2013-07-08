/**
 * NamedRegexp = a regular expression matcher, where instead of indexed parenthesised groups, you can use names.
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
var NamedRegexp = function(pattern, mapVariableToRegexp) {
	if (!pattern) throw new Error("null pattern");
	if (!mapVariableToRegexp) throw new Error("null mapVariableToRegexp");
	//console.log("before: "+pattern);
	pattern = RegExp.escape(pattern);
	//console.log("after: "+pattern);
	
	var variableArray = [];
	for (var variable in mapVariableToRegexp) {
		var charIndex = pattern.indexOf(variable);
		if (charIndex>=0)
			variableArray.push({variable: variable, charIndex: charIndex});
	}
	variableArray.sort(function(a,b){return a.charIndex-b.charIndex;}); // sort by increasing index;
	
	var mapVariableToIndex = {};
	for (var variableIndex=0; variableIndex<variableArray.length; ++variableIndex) {
		var variable = variableArray[variableIndex] = variableArray[variableIndex].variable;
		mapVariableToIndex[variable] = variableIndex;
		pattern = pattern.replace(variable, "("+mapVariableToRegexp[variable]+")");
	}
	
	this.variableArray = variableArray;
	this.mapVariableToIndex = mapVariableToIndex;
	
	this.regexp = new RegExp(pattern);
}


NamedRegexp.prototype = {
	exec: function(string) {
		var matches = this.regexp.exec(string);
		var mapVariableToValue = {};
		for (var variableIndex=0; variableIndex<this.variableArray.length; ++variableIndex) {
			var variable = this.variableArray[variableIndex];
			var value = matches[variableIndex+1];
			mapVariableToValue[variable] = value;
		}
		return mapVariableToValue;
	}
}

/**
 * a convenience method: match the text against the given pattern (regular expression with named variables), 
 * and return the assignments to the variables.
 */
NamedRegexp.match = function(text, pattern, mapVariableToRegexp) {
	return new NamedRegexp(pattern,mapVariableToRegexp).exec(text);
}


module.exports = NamedRegexp;


// DEMO PROGRAM:
if (process.argv[1] === __filename) {
	console.log("named_regexp.js demo start");
	var variables = {
		"<number>": "\\d+",
		"<currency>": "[^ ]+",
	};
	var nr = new NamedRegexp("I offer a salary of <number> <currency>", variables);
	console.dir(nr.exec("I offer a salary of 20000 USD"));
	
	console.dir(NamedRegexp.match("I offer a salary of 20000 USD", "I offer a salary of <number> <currency>", variables));
	console.log("named_regexp.js demo end");
}

