var assert = require('should'),
		scfg = require("../scfg"),
		ScfgTranslator = require("../scfg_translator"),
		fs = require('fs');


describe('Synchronous Context Free Grammar Translator', function() {
	it('should work with 1-level grammar', function() {
		var grammar = scfg.fromString(fs.readFileSync("../grammars/Grammar1Flat.txt", 'utf8'));
		var translator = new ScfgTranslator(grammar);
		translator.translate("a", true).should.eql({"b":true});  // single forward  translation
		translator.translate("b", false).should.eql({"a":true}); // single backward translation
		translator.translate("a c", true).should.eql({"b":true,"d":true});   // two forward  translations
		translator.translate("d b", false).should.eql({"a":true,"c":true}); // two backward translations
		translator.translate("a c a", true).should.eql({"b":true,"d":true});    // three forward  translations
		translator.translate("b d b", false).should.eql({"a":true,"c":true});  // three backward translations
		translator.translate("b d", true).should.eql({});  // no forward  translation
		translator.translate("a c", false).should.eql({}); // single backward translation
	})
	
	it('should work with 2-level grammar', function() {
		var grammar = scfg.fromString(fs.readFileSync("../grammars/Grammar2Finite.txt", 'utf8'));
		var translator = new ScfgTranslator(grammar);
		//translator.logger.active = true;
		translator.translate("take the bread", true).should.eql({"DO(GET,FOOD)":true});  // single forward  translation
		translator.translate("DO(GET,FOOD)", false).should.eql({"take the bread":true}); // single backward translation
		translator.translate("take the bread and give the water", true).should.eql({"DO(GET,FOOD)":true,"DO(PUT,FLUID)":true});  // two forward  translations
		translator.translate("DO(GET,FOOD) & DO(PUT,FLUID)", false).should.eql({"take the bread":true,"give the water":true});  // two backward  translations
	})
	
	it('should work with 2-level ambiguous grammar', function() {
		var grammar = scfg.fromString(fs.readFileSync("../grammars/Grammar3Ambiguous.txt", 'utf8'));
		var translator = new ScfgTranslator(grammar);
		translator.translate("take the bread", true).should.eql({"DO(GET,FOOD)":true,"DO(GET)":true});  // several forward  translation
		//translator.logger.active = true;
		translator.translate("DO(GET,FOOD)", false).should.eql({"take the bread":true,"get the bread":true,"take the food":true,"get the food":true}); // several backward translation
	})
	
	it('should handle special regexp chars and indexed variables', function() {
		var grammar = scfg.fromString(fs.readFileSync("../grammars/Grammar4EvilChars.txt", 'utf8'));
		var translator = new ScfgTranslator(grammar);
		translator.translate("1?", true).should.eql({"WHY(1)":true});  // one forward  translation
		translator.translate("\\1", true).should.eql({"BACKSLASH(1)":true});  // one forward  translation
		translator.translate("0+1", true).should.eql({"ADD(0,1)":true});  // one forward  translation
		translator.translate("1*1", true).should.eql({"MUL(1,1)":true});  // one forward  translation
		//translator.logger.active = true;
	})
	
	it('should work with a recursive grammar', function() {
		var grammar = scfg.fromString(fs.readFileSync("../grammars/Grammar5Recursive.txt", 'utf8'));
		var translator = new ScfgTranslator(grammar);
		translator.translate("(a + a)", true).should.eql({"a":true, "ADD(a,a)":true});  // several forward  translation
		translator.translate("(a * a)", true).should.eql({"a":true, "MUL(a,a)":true});  // several forward  translation
		translator.logger.active = true;
		translator.translate("(a + (a * a))", true).should.eql({"a":true, "MUL(a,a)":true, "ADD(a,MUL(a,a))":true});  // several forward  translation
	})
})
