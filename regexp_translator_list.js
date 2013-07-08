/**
 * RegexpTranslatorList = a list of pairs of regular expressions with names, that can be used for translation.
 * See the main program, at the bottom of this file, for an example.
 */


var RegexpTranslator = require('./regexp_translator');


/**
 * Initialize a RegexpTranslatorList.
 *
 * @param mapPatternToTranslation a hash that maps source-patterns to target-patterns.
 * @param mapVariableToRegexp - a hash where the keys are variables, and the values are (usual) regular expressions, 
 *   for example:  {"<number>": "\\d+", "<currency>": "[^ ]*"} 
 */
var RegexpTranslatorList = function(mapPatternToTranslation, mapVariableToRegexp) {
	this.regexp_translators = [];
	for (var source in mapPatternToTranslation) {
		var target = mapPatternToTranslation[source];
		this.regexp_translators.push(
			new RegexpTranslator(source, target, mapVariableToRegexp));
	}
}

RegexpTranslatorList.prototype = {
	/**
	 * Translate the string back or forth.
	 *
	 * @param string a text string.
	 * @param forward (boolean) - true to translate from source to target, false to translate from target to source.
	 * @return a list of translations.
	 */
	translate: function(string, forward) {
		var translations = [];
		this.addTranslations(string,forward,translations);
		return translations;
	},
	
	/**
	 * Add the translations of the given string to the given translationsOutput array.
	 *
	 * @param string a text string.
	 * @param forward (boolean) - true to translate from source to target, false to translate from target to source.
	 * @param translationsOutput - an array where the translations will be inserted. 
	 * @return a list of translations.
	 */
	addTranslations: function(string, forward, translationsOutput) {
		this.regexp_translators.forEach(function(translator) {
			translator.addTranslations(string, forward, translationsOutput); 
		});
	},
	
}

module.exports = RegexpTranslatorList;


// DEMO PROGRAM:
if (process.argv[1] === __filename) {
	console.log("regexp_translator_list.js demo start");
	var variables = {
		"<number>": "\\d+",
		"<currency>": "[^() ]+",
	};
	
	var translator = new RegexpTranslatorList({
			"I offer a salary of <number> <currency>": "OFFER(<number>-<currency>)",
			"I offer a car": "OFFER(CAR)",
		}, 
		variables);
	console.log("single forward  translation: "+translator.translate("I offer a salary of 20000 USD", true));
	console.log("single backward translation: "+translator.translate("OFFER(20000-USD)", false));
	console.log("two forward  translations: "+translator.translate("I offer a salary of 20000 USD and I offer a salary of 40000 ILS", true));
	console.log("two backward translations: "+translator.translate("OFFER(20000-USD),OFFER(40000-ILS)", false));
	console.log("three forward  translations: "+translator.translate("I offer a salary of 20000 USD and I offer a car and I offer a salary of 40000 ILS", true));
	console.log("three backward translations: "+translator.translate("OFFER(CAR),OFFER(20000-USD),OFFER(40000-ILS)", false));
	console.log("no forward  translations: "+translator.translate("I offer a company car", true));
	console.log("no backward translations: "+translator.translate("OFFER(COMPANY-CAR)", false));

	console.log("regexp_translator_list.js demo end");
}

