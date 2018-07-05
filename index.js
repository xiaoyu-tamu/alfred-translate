'use strict';
const translate = require('google-translate-api');
const isChinese = require('is-chinese');
const alfy = require('alfy');

const EN = 'en';
const ZH = 'zh-CN';
const GOOGLE_API = 'https://translate.google.com';

const { input, output } = alfy;
const inputIsChinese = isChinese(input);
const from = inputIsChinese ? ZH : EN;
const to = inputIsChinese ? EN : ZH;

const lookupUrl = `${GOOGLE_API}/#${from}/${to}/${encodeURIComponent(input)}`;

const result = [];
translate(input, { raw: true, to }).then(data => {
	const isAutoCorrected = data.from.text.autoCorrected;

	if (isAutoCorrected) {
		const correctedWord = data.from.text.value.replace(/\[/, '').replace(/\]/, '');
		result.push({
			title: data.text,
			subtitle: `要查询 ${correctedWord} 吗?`,
			autocomplete: correctedWord,
		});
	} else {
		const found = JSON.parse(data.raw)[1];
		if (found) {
			for (const [partOfSpeech, _, candidates] of found) {
				for (const [text, synonym] of candidates) {
					result.push({
						title: text,
						arg: text,
						subtitle: toSubtitle(partOfSpeech, synonym.join(',')),
						variables: { pronounce: 0 },
						quicklookurl: lookupUrl,
						mods: {
							cmd: {
								subtitle: '请按 ↵ 发音',
								variables: { pronounce: 1, word: inputIsChinese ? text : input },
							},
						},
					});
				}
			}
		}
	}

	output(result);
});

function toSubtitle(prefix, content) {
	return prefix ? `「${prefix}」 ${content}` : content;
}
