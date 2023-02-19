/*!license: The MIT License (MIT)

Copyright (c) 2016 Justin Sippel, Vitaly Domnikov
Modified by CrowbarTools (c) 2023

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


const HIGH_SURROGATE_START = 0xd800,
	HIGH_SURROGATE_END = 0xdbff,
	LOW_SURROGATE_START = 0xdc00,
	REGIONAL_INDICATOR_START = 0x1f1e6,
	REGIONAL_INDICATOR_END = 0x1f1ff,
	FITZPATRICK_MODIFIER_START = 0x1f3fb,
	FITZPATRICK_MODIFIER_END = 0x1f3ff,
	VARIATION_MODIFIER_START = 0xfe00,
	VARIATION_MODIFIER_END = 0xfe0f,
	DIACRITICAL_MARKS_START = 0x20d0,
	DIACRITICAL_MARKS_END = 0x20ff,
	ZWJ = 0x200d,
	GRAPHEMS = [
		0x0308, // ( ◌̈ ) COMBINING DIAERESIS
		0x0937, // ( ष ) DEVANAGARI LETTER SSA
		0x093F, // ( ि ) DEVANAGARI VOWEL SIGN I
		0x0BA8, // ( ந ) TAMIL LETTER NA
		0x0BBF, // ( ி ) TAMIL VOWEL SIGN I
		0x0BCD, // ( ◌்) TAMIL SIGN VIRAMA
		0x0E31, // ( ◌ั ) THAI CHARACTER MAI HAN-AKAT
		0x0E33, // ( ำ ) THAI CHARACTER SARA AM
		0x0E40, // ( เ ) THAI CHARACTER SARA E
		0x0E49, // ( เ ) THAI CHARACTER MAI THO
		0x1100, // ( ᄀ ) HANGUL CHOSEONG KIYEOK
		0x1161, // ( ᅡ ) HANGUL JUNGSEONG A
		0x11A8, // ( ᆨ ) HANGUL JONGSEONG KIYEOK
	],
	betweenInclusive = (value: number, lower: number, upper: number) : boolean => (value >= lower && value <= upper),
	isRegionalIndicator = (string: string) : boolean => betweenInclusive(codePointFromSurrogatePair(string), REGIONAL_INDICATOR_START, REGIONAL_INDICATOR_END),
	nextUnits = (pos: number, string: string) : number => {
		const current = string[pos]
		if (
			pos === string.length - 1 ||
			!current ||
			!betweenInclusive(current[0].charCodeAt(0), HIGH_SURROGATE_START, HIGH_SURROGATE_END)
		) {
			return 1
		}

		const nextPair = string.substring(pos + 2, pos + 5)
		if (
			(
				isRegionalIndicator(current + string[pos + 1]) &&
				isRegionalIndicator(nextPair)
			) ||
			betweenInclusive(codePointFromSurrogatePair(nextPair), FITZPATRICK_MODIFIER_START, FITZPATRICK_MODIFIER_END)
		) {
			return 4
		}
		return 2
	},
	isVariationSelector = (string: string) : boolean => (typeof string === 'string' && betweenInclusive(string.charCodeAt(0), VARIATION_MODIFIER_START, VARIATION_MODIFIER_END)),
	isDiacriticalMark = (string: string) : boolean => (typeof string === 'string' && betweenInclusive(string.charCodeAt(0), DIACRITICAL_MARKS_START, DIACRITICAL_MARKS_END)),
	isGraphem = (string: string) : boolean => (typeof string === 'string' && GRAPHEMS.includes(string.charCodeAt(0))),
	isZeroWidthJoiner = (string: string) : boolean => (typeof string === 'string' && string.charCodeAt(0) === ZWJ),
	codePointFromSurrogatePair = (pair: string) : number => ((pair.charCodeAt(0) - HIGH_SURROGATE_START) << 10) + pair.charCodeAt(1) - LOW_SURROGATE_START + 0x10000;

export default (string: string): string[] => {
	if (typeof string !== 'string') {
		throw new TypeError('string cannot be undefined or null')
	}
	const result: string[] = []
	let i = 0, increment = 0;
	while (i < string.length)
	{
		increment += nextUnits(i + increment, string);
		if (isGraphem(string[i + increment])) {
			increment++;
		}
		if (isVariationSelector(string[i + increment])) {
			increment++;
		}
		if (isDiacriticalMark(string[i + increment])) {
			increment++;
		}
		if (isZeroWidthJoiner(string[i + increment])) {
			increment++;
			continue;
		}
		result.push(string.substring(i, i + increment))
		i += increment;
		increment = 0;
	}
	return result;
}