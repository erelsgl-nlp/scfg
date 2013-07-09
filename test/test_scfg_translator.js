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
	})
	
	
	it('should work with 2-level ambiguous grammar', function() {
		var grammar = scfg.fromString(fs.readFileSync("../grammars/Grammar3Ambiguous.txt", 'utf8'));
		var translator = new ScfgTranslator(grammar);
		//translator.logger.active = true;
		translator.translate("take the bread", true).should.eql({"DO(GET,FOOD)":true,"DO(GET)":true});  // several forward  translation
		//translator.translate("DO(GET,FOOD)", false).should.eql({"take the bread":true,"get the bread":true,"take the food":true,"get the food":true}); // several backward translation
	})
	
	it('should work with a recursive grammar', function() {
		var grammar = scfg.fromString(fs.readFileSync("../grammars/Grammar5Recursive.txt", 'utf8'));
		var translator = new ScfgTranslator(grammar);
		translator.logger.active = true;
		translator.translate("a+b", true).should.eql({"PLUS(a,b)":true});  // several forward  translation
	})
})
