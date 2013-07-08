/**
 * RegexpTranslator = a translator between two formal languages, based on two regular expressions with named variables..
 *
 * for example, if pattern1 = "I offer a salary of <number> <currency>", 
 * and             pattern2 = OFFER(<number>-<currency>),
 * then the sentence:       "I offer a salary of 20000 USD"
 * will be translated into: OFFER(20000-USD)
 */

var RegexpWithNames = require('./regexp_names');


/**
 * Initialize a RegexpTranslator.
 *
 * @param source, target (string) - two strings with some variables, 
 *   for example: "I offer a salary of <number> <currency>", "OFFER(<number>-<currency>)".
 * @param mapVariableToRegexp - a hash where the keys are variables, and the values are (usual) regular expressions, 
 *   for example:  {"<number>": "\\d+", "<currency>": "[^ ]*"} 
 */
var RegexpTranslator = function(source, target, mapVariableToRegexp) {
	this.source = source;
	this.target = target;
	this.sourcePattern = new RegexpWithNames(source,mapVariableToRegexp);
	this.targetPattern = new RegexpWithNames(target,mapVariableToRegexp);
}


RegexpTranslator.prototype = {
	/**
	 * Translate the string back or forth.
	 *
	 * @param string a text string.
	 * @param forward (boolean) - true to translate from source to target, false to translate from target to source.
	 * @return a list of translations.
	 */
	translate: function(string, forward) {
		if (forward) {
			var sourcePattern = this.sourcePattern;
			var target = this.target;
		} else {
			var sourcePattern = this.targetPattern;
			var target = this.source;
		}
		var assignments = sourcePattern.matches(string);
		var translations = [];
		assignments.forEach(function(mapVariableToValue) {
			var translation = target;
			for (var variable in mapVariableToValue) {
				var value = mapVariableToValue[variable];
				translation = translation.replace(variable, value);
			}
			translations.push(translation);
		});
		return translations;
	},
}


module.exports = RegexpWithNames;


// DEMO PROGRAM:
if (process.argv[1] === __filename) {
	console.log("regexp_translator.js demo start");
	var variables = {
		"<number>": "\\d+",
		"<currency>": "[^() ]+",
	};
	
	var translator = new RegexpTranslator("I offer a salary of <number> <currency>", "OFFER(<number>-<currency>)", variables);
	console.log("single forward  translation: "+translator.translate("I offer a salary of 20000 USD", true));
	console.log("single backward translation: "+translator.translate("OFFER(20000-USD)", false));
	console.log("two forward  translations: "+translator.translate("I offer a salary of 20000 USD and I offer a salary of 40000 ILS", true));
	console.log("two backward translations: "+translator.translate("OFFER(20000-USD),OFFER(40000-ILS)", false));
	console.log("no forward  translations: "+translator.translate("I offer a company car", true));
	console.log("no backward translations: "+translator.translate("OFFER(CAR)", false));

	console.log("regexp_translator.js demo end");
}

