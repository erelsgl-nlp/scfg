/**
 * ScfgTranslator = a translator based on a synchronous context-free grammar.
 * Uses a parsing algorithm inspired by Earley top-down parsing.
 * See the main program, at the bottom of this file, for an example.
 */


var RegexpWithNames = require('./regexp_names');
var RegexpTranslator = require('./regexp_translator');
var OneTimeQueue = require('./OneTimeQueue');
var scfg = require('./scfg');
var assert = require('assert');
var util = require('util');


/* internal classes */

	/**
	 * This is the basic element in the queues used by the algorithm.
	 *
	 * @author Erel Segal Halevi
	 * @since 2013-03
	 */
	var SubtextRulePair  = function(subText, variableName, naturalLanguage, semanticTranslation, assignment) {
			this.subText = subText;   // String - some conversion of T to a flat string
			this.variableName = variableName;  // String - V
			this.naturalLanguage = naturalLanguage;  // String - some conversion of N to a flat string
			this.semanticTranslation = semanticTranslation;  // String - M  (Meaning representation)
			this.assignment = assignment;  // VariableAssignments (optional)
	}
	
	SubtextRulePair.prototype = {
		/**
		 * Assert that all variables in the natural language and the semantic representation are assigned.
		 */
		assertVariablesAreAssigned: function() {
			assert.ok(this.assignment, "Must have a non-null assignment to the variables");
			assert.ok(assignment.variableNames().containsAll(TextVariablesUtils.allVariablesInString(this.naturalLanguage)),
				"All variables in the natural language sentence '"+this.naturalLanguage+"' should have an assignment, but the assignment is '"+assignment+"'");
			assert.ok(assignment.variableNames().containsAll(TextVariablesUtils.allVariablesInString(this.semanticTranslation)),
				"All variables in the Semantic sentence '"+this.semanticTranslation+"' should have an assignment, but the assignment is '"+assignment+"'");
		},

		/**
		 * Assert that there are no variables in the natural language or semantic representation.
		 */
		assertNoVariables: function() {
			Assert.equal(TextVariablesUtils.hasVariables(this.naturalLanguage), false, "Natural language sentence '"+this.naturalLanguage+"' should be clean, with no variables"); // input must be clean, with no variables  
			Assert.equal(TextVariablesUtils.hasVariables(this.semanticTranslation), false, "Semantic sentence '"+this.semanticTranslation+"' should be clean, with no variables"); // input must be clean, with no variables  
		},

		toString: function() {
			return "('"+this.subText +"', " +
					this.variableName + " -> " + this.naturalLanguage + " / "+this.semanticTranslation + 
					(this.assignment==null? "": ", "+this.assignment) + ")";
		},

		hasTextAndVariableName: function(subText, variableName) {
			return 
				(this.variableName == variableName) &&
				(this.subText == subText);
		},
	} // end class SubtextRulePair


	var logger = {
		startAction: function(topic) {
			console.log("SCFGT "+topic+" start");
		},
		endAction: function(string) {
			console.log("SCFGT "+" end "+string);
		},
		info: function(string) {
			console.log("SCFGT "+string);
		},
	}


/**
 * @return a clone of the given array of strings, sorted from long to short.
 */
function sortedFromLongToShort(array) {
				array = array.map(function(a){return a;});  // == clone
				array.sort(function(a,b) {  // sort from long to short
					if (a.length!=b.length) return b.length - a.length; // note reverse order
					else return a.localeCompare(b);
				});
				return array;
}

/* main class */

/**
 * Initialize a ScfgTranslator.
 *
 * @param grammar a SynchronousContextFreeGrammar (see scfg.js).
 * @param grammarRoot string, the root of the grammar (e.g. "<root>")
 * @param entail a function that gets text and hypothesis and returns a list of assignments (see regexp_names.js);
 */
var ScfgTranslator = function(grammar, grammarRoot, entail) {
	this.grammar = grammar;
	this.grammarRoot = grammarRoot;
	this.entail = entail;
	
	this.rootTranslationMap = grammar.translationsOfNonterminal(grammarRoot);
	if (this.rootTranslationMap==null)
		throw new IllegalArgumentException("Grammar contains no root translations! Root translations should be under the "+grammarRoot+" heading.");
}

ScfgTranslator.prototype = {
	/**
	 * Translate the string back or forth.
	 *
	 * @param string a text string.
	 * @param forward (boolean) - true to translate from source to target, false to translate from target to source.
	 * @return a list of translations.
	 */
	translate: function(text, forward) {
		if (forward) {
			logger.startAction("translate '"+text+"'");
			var rootTranslations = this.forwardTranslations(text);
			logger.endAction(rootTranslations.toString());
			return rootTranslations;
		} else {
			throw new Error("Reverse translation is not supported here");
		}
	},
	
	
	forwardTranslations: function(text) {
		// DATA STRUCTURES:
		var openQueue = new OneTimeQueue();
		var goodStack = [];
		var cleanSet = {};
		
		var mainTextId = null;
		logger.startAction("Initialization");
		{
			var variableName = this.grammarRoot;
			var nonterminalTranslationMap = this.rootTranslationMap;
			var sortedNonterminalProductions = sortedFromLongToShort(Object.keys(nonterminalTranslationMap));
			
			sortedNonterminalProductions.forEach(function(nonterminalProduction) {
				var semanticTranslation = nonterminalTranslationMap[nonterminalProduction];
				openQueue.add(new SubtextRulePair(text, variableName, nonterminalProduction, semanticTranslation)); // add the pair (Text, {root}->Ni/Mj)
			});
		} // end of initialization
		
		logger.endAction("Open.size="+openQueue.size()+" Good.size="+goodStack.length, null); 

		logger.startAction("Downward Loop");
		while (!openQueue.isEmpty()) {
			var currentPair = openQueue.remove(); // (T, V->N)
			logger.startAction("Drilling down on "+currentPair);
			var assignments = this.entail(currentPair.subText, currentPair.naturalLanguage); // entail(T,N)
			assignments.forEach(function(assignment) {
				goodStack.push(new SubtextRulePair(currentPair.text, currentPair.variableName, currentPair.nonterminalProduction, currentPair.semanticTranslation, assignment));
				for (var variableName in assignment) {
					if (grammar.hasNonterminal(variableName)) { // variable has translations - it is a nonterminal:   
						var nonterminalTranslationMap = grammar.translationsOfNonterminal(variableName);  // N/M
						var sortedNonterminalProductions = sortedFromLongToShort(Object.keys(nonterminalTranslationMap));
						var variableValue = assignment[variableName];
						sortedNonterminalProductions.forEach(function(nonterminalProduction) {
							var semanticTranslation = nonterminalTranslationMap[nonterminalProduction];
							openQueue.add(new SubtextRulePair(text, variableName, nonterminalProduction, semanticTranslation)); // add the pair (Text, {root}->Ni/Mj)
						});
					}
				}  // end of loop over variables in a single assignment
			});  // end of loop over assignments in a single entailment
			logger.endAction("Open.size="+openQueue.size()+" Good.size="+goodStack.length); 
		} // end of downward loop (if openQueue is empty, exit)

		logger.startAction("Upward Loop");
		while (goodStack.length) {
			var currentTriple = goodStack.pop(); // (T, V->N, assignment)
			logger.info("Climbing up on "+currentTriple);
			if (!currentTriple.assignment.hasVariables()) {
				cleanSet[new SubtextRulePair(currentTriple.text, currentTriple.variableName, currentTriple.nonterminalProduction, currentTriple.semanticTranslation, null)]=true;
			} else {  //current assignment has variables
				var variableName = currentTriple.assignment.variableNames().iterator().next();       // Vk
				var variableValue = currentTriple.assignment[variableName];   // Ak
				var assignedString = currentTriple.assignment.stringAssignment(variableName); 
				var assignmentWithoutVariable = currentTriple.assignment.clone(); // assignment without Vk
				delete assignmentWithoutVariable[variableName];
				if (grammar.hasNonterminal(variableName)) { // variable has translations - it is a nonterminal - clean it by replacing previously clean pairs:
					for (var previousCleanPair in cleanSet) {
						if (previousCleanPair.hasTextAndVariableName(assignedSubtreeId, variableName)) { // find pairs with (Ak, Vk -> ?)
							var newTriple = new SubtextRulePair(currentTriple.text, currentTriple.variableName, currentTriple.nonterminalProduction, currentTriple.semanticTranslation, assignmentWithoutVariable);
							newTriple.naturalLanguage = newTriple.naturalLanguage.replace(variableName, previousCleanPair.naturalLanguage);  // N*
							newTriple.semanticTranslation = newTriple.semanticTranslation.replace(variableName, previousCleanPair.semanticTranslation);  // M*
							goodStack.push(newTriple);
						}
					}
				} else {  // variable has no translations - it is a terminal variable:
					var newTriple = new SubtextRulePair(currentTriple, assignmentWithoutVariable);
					newTriple.naturalLanguage = newTriple.naturalLanguage.replace(variableName, assignedString);  // N*
					newTriple.semanticTranslation = newTriple.semanticTranslation.replace(variableName, assignedString);  // M*
					goodStack.push(newTriple);
				}
			} // end of handling assignment with variables
		} // end of upward loop
		logger.endAction("Good.size="+goodStack.length+" Clean.size="+Object.keys(cleanSet).length); 
		

		logger.startAction("Finalization");
		var rootTranslations = [];
		for (var cleanPair in cleanSet) {
			logger.info("Checking "+cleanPair);
			if (cleanPair.hasTextAndVariableName(mainTextId, grammarRoot))  { // find pairs with (Text, {root} -> ?)
				logger.info("Results += "+cleanPair.naturalLanguage+"/"+cleanPair.semanticTranslation);
				cleanPair.assertNoVariables();  
				rootTranslations.push(cleanPair.semanticTranslation);
			}
		}
		logger.endAction("Good.size="+goodStack.length+" Clean.size="+Object.keys(cleanSet).length); 
		return rootTranslations;
	},
}

module.exports = ScfgTranslator;


// DEMO PROGRAM:
if (process.argv[1] === __filename) {
	console.log("scfg_translator.js demo start");
	
	var fs = require('fs');
	var grammar = scfg.fromString(fs.readFileSync("NegotiationGrammarJsonMinimalAngled.txt",'utf8'));
	//console.log("\nGRAMMAR:\n"); console.dir(grammar);
	
	var variables = {
		"<number>": "\\d+",
		"<currency>": "[^() ]+",
	};
	
	var translator = new ScfgTranslator(grammar, "<root>", RegexpWithNames.matches(variables));

	console.log("single forward  translation: "+translator.translate("I offer a salary of 20000 USD", true));
	//console.log("single backward translation: "+translator.translate("OFFER(20000-USD)", false));
	console.log("two forward  translations: "+translator.translate("I offer a salary of 20000 USD and I offer a salary of 40000 ILS", true));
	//console.log("two backward translations: "+translator.translate("OFFER(20000-USD),OFFER(40000-ILS)", false));
	console.log("three forward  translations: "+translator.translate("I offer a salary of 20000 USD and I offer a car and I offer a salary of 40000 ILS", true));
	//console.log("three backward translations: "+translator.translate("OFFER(CAR),OFFER(20000-USD),OFFER(40000-ILS)", false));
	console.log("no forward  translations: "+translator.translate("I offer a company car", true));
	//console.log("no backward translations: "+translator.translate("OFFER(COMPANY-CAR)", false));

	console.log("scfg_translator.js demo end");
}

