/**
 * SCFG = Syncronous Context Free Grammar
 */
 



var SynchronousContextFreeGrammar = function(grammarMap) {
	this.grammarMap = grammarMap;
}

SynchronousContextFreeGrammar.prototype = {
	nonterminals: function() {
		return Object.keys(this.grammarMap);
	},
	
	translationsOfNonterminal: function (nonterminal) {
		return this.grammarMap[nonterminal];
	},
	
	hasNonterminal: function(nonterminal) {
		return nonterminal in this.grammarMap;
	},

	
	/**
	 * Generate all strings from the given startNonterminal, with the given maxDepth.
	 */
	expand: function(startNonterminal, maxDepth, variableDescriptionType, verbosity) {
		if (!this.expandedGrammarMap)  expandedGrammarMap = {};
		if (startNonterminal in expandedGrammarMap)
			return expandedGrammarMap[startNonterminal];

		if (verbosity) console.log("expand from "+startNonterminal);

		var translationsFromStartNonterminal = this.translationsOfNonterminal(startNonterminal);
		if (translationsFromStartNonterminal==null)
			throw new NullPointerException("No translations from startNonterminal "+startNonterminal);
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

/*
 * FORMATTING:
 */

var headingPattern = /[=]+\s*(.*?)\s*[=]+\s*/;
var listItemPattern = /[*]+\s*(.*)/;
var commentPattern = /\s*#.*?$/;
var separatorPattern = /\s*\/\s*/;

module.exports = {
	DEFAULT_GRAMMAR_ROOT: "<root>",

	/**
	 * Create a new SCFG from the given string.
	 */
	fromString: function(grammarString) {
		var grammarLines = grammarString.split(/[\r\n]/);
		var grammarMap = {};
		var currentTitle = null;
		grammarLines.forEach(function(line) {
			line = line.replace(commentPattern, "");
			line = line.trim();
			if ((matcher = headingPattern.exec(line))) {
				currentTitle = matcher[1].trim();
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
		return new SynchronousContextFreeGrammar(grammarMap);
	} // end function fromString
};


// DEMO PROGRAM:
if (process.argv[1] === __filename) {
	console.log("scfg.js demo start");
	var fs = require('fs');
	var scfg = module.exports.fromString(fs.readFileSync("NegotiationGrammarJsonMinimalAngled.txt",'utf8'));
	console.log("\nGRAMMAR:\n");
	console.dir(scfg);
	console.log("\nEXPANDED GRAMMAR:\n");
	console.dir(scfg.expand(module.exports.DEFAULT_GRAMMAR_ROOT, 10, null, 1));
	console.log("scfg.js demo end");
}