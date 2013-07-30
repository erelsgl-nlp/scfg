/**
 * ScfgTranslator = a translator based on a synchronous context-free grammar.
 * Uses a parsing algorithm inspired by Earley top-down parsing.
 * See the main program, at the bottom of this file, for an example.
 */


var RegexpWithNames = require('./regexp_names');
var LoggingOneTimeQueue = require('./LoggingOneTimeQueue');
var LoggingStack = require('./LoggingStack');
var sets = require('simplesets');
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
			//assert.equal(TextVariablesUtils.hasVariables(this.naturalLanguage), false, "Natural language sentence '"+this.naturalLanguage+"' should be clean, with no variables"); // input must be clean, with no variables  
			//assert.equal(TextVariablesUtils.hasVariables(this.semanticTranslation), false, "Semantic sentence '"+this.semanticTranslation+"' should be clean, with no variables"); // input must be clean, with no variables  
		},

		toString: function() {
			return "('"+this.subText +"', " +
					this.variableName + " -> " + this.naturalLanguage + " / "+this.semanticTranslation + 
					(this.assignment==null? "": ", "+JSON.stringify(this.assignment)) + ")";
		},

		hasTextAndVariableName: function(subText, variableName) {
			//console.log("hasTextAndVariableName "+subText+","+variableName);
			var result =
				(this.variableName == variableName) &&
				(this.subText == subText);
			//console.log(result);				
			return result;
		},
		
		withNewAssignment: function(newAssignment) {
			return new SubtextRulePair(this.subText, this.variableName, this.naturalLanguage, this.semanticTranslation, newAssignment);
		}
	} // end class SubtextRulePair




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
	
	/**
	 * Returns a copy of the object where the keys have become the values and the values the keys. For this to work, all of your object's values should be unique and string serializable
	 */
	function inverted(hash) {
		var inverted = {};
		for (key in hash)
			inverted[hash[key]]=key;
		return inverted;
	}

/* main class */

/**
 * Initialize a ScfgTranslator.
 *
 * @param grammar a SynchronousContextFreeGrammar (see scfg.js).
 * @param entail [optional] a function that gets text (T) and hypothesis with variables (H), and returns a list of assignments to the variables of H, such that the result is entailed by T.
 *        The default 'entail' function is just identity match (see regexp_names.js).
 */
var ScfgTranslator = function(grammar, entail) {
	if (!grammar) throw new Error("empty grammar");
	this.grammar = grammar;
	
	if (!entail) {  // create a default (identity match) entail function: 
		// create the variables configuration:
		var variables = grammar.variables();
		grammar.nonterminals().forEach(function(nonterminal) {
			if (!(nonterminal in variables))
				variables[nonterminal] = ".+";
		});
		entail = RegexpWithNames.matches(variables);
	}
	
	
	this.entail = entail;
}

ScfgTranslator.prototype = {

	/**
	 * Translate the string back or forth.
	 *
	 * @param string a text string.
	 * @param forward (boolean) - true to translate from source to target, false to translate from target to source.
	 * @return a set of translations (a hash whose KEYS are translations)..
	 */
	translate: function(text, forward) {
		var grammar = this.grammar;
		var logger = this.logger;
		
		logger.startAction("translate '"+text+"'");

		// DATA STRUCTURES:
		var openQueue = new LoggingOneTimeQueue(this.logger);
		var goodStack = new LoggingStack(this.logger);
		var cleanSet = new sets.Set();
		
		var mainTextId = null;
		logger.startAction("Initialization");
		{
			var variableName = grammar.root();
			var nonterminalTranslationMap = grammar.translationsOfNonterminal(variableName); 
			if (!forward)
				nonterminalTranslationMap = inverted(nonterminalTranslationMap);
			var sortedNonterminalProductions = sortedFromLongToShort(Object.keys(nonterminalTranslationMap));

			sortedNonterminalProductions.forEach(function(nonterminalProduction) {
				var semanticTranslation = nonterminalTranslationMap[nonterminalProduction];
				openQueue.add(new SubtextRulePair(
					text, variableName, nonterminalProduction, semanticTranslation)); // add the pair (Text, {root}->Ni/Mj)
			});
		} // end of initialization
		
		logger.endAction("Initialization; Open.size="+openQueue.size()+" Good.size="+goodStack.size()+"\n"); 

		logger.startAction("Downward Loop");
		while (!openQueue.isEmpty()) {
			var currentPair = openQueue.remove(); // (T, V->N)
			logger.startAction("Drilling down on "+currentPair);
			var assignments = this.entail(currentPair.subText, currentPair.naturalLanguage); // assignment=entail(T,N)
			assignments.forEach(function(assignment) {
				goodStack.push(currentPair.withNewAssignment(assignment));  // (T, V->N, assignment)
				for (var variableName in assignment) {
					var variableValue = assignment[variableName];
					if (grammar.hasNonterminal(variableName)) { // variable has translations - it is a nonterminal:   
						var nonterminalTranslationMap = grammar.translationsOfNonterminal(variableName);  // N/M
						if (!forward)
							nonterminalTranslationMap = inverted(nonterminalTranslationMap);
						
						var sortedNonterminalProductions = sortedFromLongToShort(Object.keys(nonterminalTranslationMap));
						sortedNonterminalProductions.forEach(function(nonterminalProduction) {
							var semanticTranslation = nonterminalTranslationMap[nonterminalProduction];
							openQueue.add(new SubtextRulePair(
								variableValue, variableName, nonterminalProduction, semanticTranslation)); // add the pair (Text, {root}->Ni/Mj)
						});
					}
				}  // end of loop over variables in a single assignment
			});  // end of loop over assignments in a single entailment
			logger.endAction("Open.size="+openQueue.size()+" Good.size="+goodStack.size()); 
		} // end of downward loop (if openQueue is empty, exit)
		logger.endAction("Downward Loop\n");

		logger.startAction("Upward Loop");
		while (!goodStack.isEmpty()) {
			var currentTriple = goodStack.pop(); // (T, V->N, assignment)
			logger.startAction("Climbing up on "+currentTriple);
			if (!Object.keys(currentTriple.assignment).length) {  // empty assignment (no variables) - clean pair!
				var newTriple = currentTriple.withNewAssignment(null);
				cleanSet.add(newTriple);
			} else {  //current assignment has variables - take one of them:
				var variableName = Object.keys(currentTriple.assignment)[0];  // Vk
				var variableValue = currentTriple.assignment[variableName];   // Ak
				var assignmentWithoutVariable = {};                           // assignment without Vk
				for (var varName in currentTriple.assignment)
					if (varName!=variableName)
						assignmentWithoutVariable[varName] = currentTriple.assignment[varName];
				if (grammar.hasNonterminal(variableName)) { // variable has translations - it is a nonterminal - clean it by replacing previously clean pairs:
					cleanSet.each(function(previousCleanPair) {
						if (previousCleanPair.hasTextAndVariableName(variableValue, variableName)) { // find pairs with (Ak, Vk -> ?)
							var newTriple = currentTriple.withNewAssignment(assignmentWithoutVariable);
							newTriple.naturalLanguage = newTriple.naturalLanguage.replace(variableName, previousCleanPair.naturalLanguage);  // N*
							newTriple.semanticTranslation = newTriple.semanticTranslation.replace(variableName, previousCleanPair.semanticTranslation);  // M*
							goodStack.push(newTriple);
						}
					});
				} else {  // variable has no translations - it is a terminal variable:
					var newTriple = new SubtextRulePair(
						currentTriple, assignmentWithoutVariable);
					newTriple.naturalLanguage = newTriple.naturalLanguage.replace(variableName, assignedString);  // N*
					newTriple.semanticTranslation = newTriple.semanticTranslation.replace(variableName, assignedString);  // M*
					goodStack.push(newTriple);
				}
			} // end of handling assignment with variables
			logger.endAction("Good.size="+goodStack.size()+" Clean.size="+cleanSet.size()); 
		} // end of upward loop
		logger.endAction("Upward loop\n"); 
		

		logger.startAction("Finalization");
		var rootTranslations = {};
		cleanSet.each(function(cleanPair) {
			logger.info("Checking "+cleanPair);
			if (cleanPair.hasTextAndVariableName(text, grammar.root()))  { // find pairs with (Text, {root} -> ?)
				logger.info("Results += "+cleanPair.naturalLanguage+"/"+cleanPair.semanticTranslation);
				cleanPair.assertNoVariables();  
				rootTranslations[cleanPair.semanticTranslation]=true;
			}
		});
		logger.endAction(JSON.stringify(rootTranslations));
		return rootTranslations;
	},
	
	logger: {
		active: false,
		startAction: function(topic) {
			if (this.active) console.log("SCFGT "+topic+" start");
		},
		endAction: function(string) {
			if (this.active) console.log("SCFGT "+"end "+string);
		},
		info: function(string) {
			if (this.active) console.log("SCFGT "+string);
		},
	},
}

module.exports = ScfgTranslator;


// DEMO PROGRAM:
if (process.argv[1] === __filename) {
	console.log("scfg_translator.js demo start");
	
	var fs = require('fs');
	var grammar = scfg.fromString(fs.readFileSync("grammars/Grammar1Flat.txt",'utf8'));
	var translator = new ScfgTranslator(grammar);
	translator.logger.active=false;

	console.log("single forward  translation: "+JSON.stringify(translator.translate("a", true)));
	console.log("single backward translation: "+JSON.stringify(translator.translate("b", false)));
	console.log("two forward  translations: "+JSON.stringify(translator.translate("a c", true)));
	console.log("two backward translations: "+JSON.stringify(translator.translate("b d", false)));
	console.log("three forward  translations: "+JSON.stringify(translator.translate("a c a", true)));
	console.log("three backward translations: "+JSON.stringify(translator.translate("b d b", false)));
	console.log("no forward  translations: "+JSON.stringify(translator.translate("b d", true)));
	console.log("no backward translations: "+JSON.stringify(translator.translate("a c", false)));

	console.log("scfg_translator.js demo end");
}

