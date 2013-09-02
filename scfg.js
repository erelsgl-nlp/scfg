/**
 * SCFG = Syncronous Context Free Grammar
 */
 



/**
 * Initialize a Syncronous Context Free Grammar.
 *
 * @param grammarMap - a hash whose keys are nonterminals and whose values are rule-lists.
 *        Each rule list is a hash whose keys are source strings and whose values are target-strings.
 *        See the demo program, at the bottom of this file, for an example. 
 * @param grammarRoot (String) - the start-symbol (aka root) of the grammar.
 */
var SynchronousContextFreeGrammar = function(grammarMap, grammarRoot) {
	this.grammarMap = grammarMap;
	this.grammarRoot = grammarRoot;
}

SynchronousContextFreeGrammar.prototype = {

	/**
	 * @return the start symbol (aka root) of this grammar.
	 */
	root: function() {
		return this.grammarRoot;
	},

	/**
	 * return an array of all nonterminals in the grammar.
	 */
	nonterminals: function() {
		return Object.keys(this.grammarMap);
	},
	
	/**
	 * @return boolean - true if the given nonterminal exists in the grammar.
	 */
	hasNonterminal: function(nonterminal) {
		return normalizedNonterminal(nonterminal) in this.grammarMap;
	},
	
	/**
	 * @return a hash {source1: target1, source2: target2, ...} with translations of a single nonterminal.
	 */
	translationsOfNonterminal: function (nonterminal) {
		return this.grammarMap[normalizedNonterminal(nonterminal)];
	},
	
	/**
	 * @return a hash {variable1: regexp1, variable2: regexp2, ...}, taken from the @Variables section of the grammar.
	 */
	variables: function (nonterminal) {
		return this.grammarMap["@Variables"] || {};
	},

	
	/**
	 * Generate all strings from the given startNonterminal, with the given maxDepth.
	 * @return hash {source1: target1, source2: target2, ...}
	 * See demo program at bottom of current file.
	 */
	expand: function(startNonterminal, maxDepth, variableDescriptionType, verbosity) {
		if (!this.expandedGrammarMap)  expandedGrammarMap = {};
		if (startNonterminal in expandedGrammarMap)
			return expandedGrammarMap[startNonterminal];

		if (verbosity) console.log("expand from "+startNonterminal);

		var translationsFromStartNonterminal = this.translationsOfNonterminal(startNonterminal);
		if (translationsFromStartNonterminal==null)
			throw new Error("No translations from startNonterminal "+startNonterminal);
		if (maxDepth<=0)    // don't expand nonterminal anymore - prevent infinite recursion
			return translationsFromStartNonterminal;
		
		// expand each nonterminal in turn:
		for (var nonterminal in this.grammarMap) { 
			var newTranslations = {};
			for (var source in translationsFromStartNonterminal) {
					var target = translationsFromStartNonterminal[source];
					if (!!~source.indexOf(nonterminal) || !!~target.indexOf(nonterminal)) {   // source contains nonterminal - expand it recursively
						var expansions = this.expand(nonterminal, maxDepth-1, variableDescriptionType, verbosity);
						for (var expansionSource in expansions) {
								var expansionTarget = expansions[expansionSource];
								newTranslations[source.replace(nonterminal, expansionSource)] = 
								                target.replace(nonterminal, expansionTarget);
						}
					} else {   // source and target do not contain nonterminal - just add a simple translation.
						newTranslations[source]=target;
					}
			}
			translationsFromStartNonterminal = newTranslations;
		}
		
		
		// expand the terminal variables (replace with examples):
		// currently disabled
		if (variableDescriptionType!=null) {
			var newTranslations = {};
			for (var source in translationsFromStartNonterminal) {
					var target = translationsFromStartNonterminal[source];
				//	var matcher = TextVariablesUtils.INSTANTIATED_VARIABLE_PATTERN.matcher(source);
				//	String newSource = source;
				//	while (matcher.find()) {
				//		String variable = matcher.group();
				//		String value = (variableDescriptionType.equals(TextVariableDescriptionParameterColonType.class)? matcher.group(1): matcher.group(2));
				//		newSource = newSource.replace(variable, value);
				//		target = target.replace(variable, value);
				//	}
				//	newTranslations.put(newSource, target);
			}
			translationsFromStartNonterminal = newTranslations;
		}

		expandedGrammarMap[startNonterminal] = translationsFromStartNonterminal;
		if (verbosity) console.log("expanded from "+startNonterminal+": "+JSON.stringify(translationsFromStartNonterminal));
		return translationsFromStartNonterminal;
	}  // end function expand
	
	
	
	
};

/**
 * A nonterminal may be indexed, for example, "<number>2". 
 * This function removes the index and returns the base variable, e.g., "<number>".
 */
function normalizedNonterminal(nonterminal) {
	return nonterminal.replace(/>\d+/,">");
}

/*
 * FORMATTING OF GRAMMAR FILES:
 */

var headingPattern = /[=]+\s*(.*?)\s*[=]+\s*/;
var listItemPattern = /[*]+\s*(.*)/;
var commentPattern = /\s*#.*?$/;
var separatorPattern = /\s*\/\s*/;

module.exports = {

	/**
	 * Create a new SCFG from the given string.
	 *
	 * The format of the string is:
	 *
	 * == root-nonterminal ==
	 * * source1 / target1
	 * * source2 / target2
	 * * ...
	 *
	 * == nonterminal-1 ==
	 * * source1 / target1
	 * * source2 / target2
	 * * ...
	 *
	 * etc.
	 *
	 * Comments start with '#' and end at the end of line.
	 *
	 * The first heading is the start symbol of the grammar (aka root).
	 */
	fromString: function(grammarString) {
		var grammarLines = grammarString.split(/[\r\n]/);
		var grammarMap = {};
		var currentTitle = null;
		var grammarRoot = null;
		grammarLines.forEach(function(line) {
			line = line.replace(commentPattern, "");
			line = line.trim();
			if ((matcher = headingPattern.exec(line))) {
				currentTitle = matcher[1].trim();
				if (!grammarRoot)
					grammarRoot = currentTitle;
			} else if ((matcher = listItemPattern.exec(line)) && currentTitle) {
				var pair = matcher[1];
				var fields = pair.split(separatorPattern);
				if (fields.length<2)  // skip empty lines
					return;
				if (!(currentTitle in grammarMap))
					grammarMap[currentTitle] = {};
				grammarMap[currentTitle][fields[0].trim()] = fields[1].trim();
			}
		});
		return new SynchronousContextFreeGrammar(grammarMap, grammarRoot);
	} // end function fromString
};


// DEMO PROGRAM:
if (process.argv[1] === __filename) {
	console.log("scfg.js demo start");
	var fs = require('fs');
	var grammar = module.exports.fromString(fs.readFileSync("grammars/NegotiationGrammarEmployer.txt",'utf8'));
	console.log("\nGRAMMAR:\n");
	console.dir(grammar);
	
	console.log("\nEXPANDED GRAMMAR:\n");
	var expandedGrammar = grammar.expand(grammar.root(), 10, null, 1);
	//console.dir(expandedGrammar);

	for (var input in expandedGrammar) 
		console.log(input+" / "+ expandedGrammar[input]);
	console.log("scfg.js demo end");
}

