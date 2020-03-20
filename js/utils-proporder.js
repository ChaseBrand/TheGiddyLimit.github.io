"use strict";

// TODO add deep sorting, e.g. "_copy" sections should be sorted
class PropOrder {
	/**
	 * @param obj
	 * @param dataProp
	 * @param [opts] Options object.
	 * @param [opts.fnUnhandledKey] Function to call on each unhandled key.
	 */
	static getOrdered (obj, dataProp, opts) {
		opts = opts || {};

		const order = PropOrder._PROP_TO_LIST[dataProp];
		if (!order) throw new Error(`Unhandled prop "${dataProp}"`);

		return this._getOrdered(obj, order, opts, dataProp);
	}

	static _getOrdered (obj, order, opts, path) {
		const out = {};
		const keySet = new Set(Object.keys(obj));
		const seenKeys = new Set();
		order.forEach(k => {
			if (typeof k === "string") {
				seenKeys.add(k);
				if (keySet.has(k)) out[k] = obj[k];
			} else {
				const key = k.key;

				seenKeys.add(key);

				if (keySet.has(key)) {
					if (!obj[key]) return out[key] = obj[key]; // Handle nulls

					if (k instanceof PropOrder._ObjectKey) {
						const nxtPath = `${path}.${key}`;
						if (k.fnGetOrder) out[key] = this._getOrdered(obj[key], k.fnGetOrder(), opts, nxtPath);
						else if (k.order) out[key] = this._getOrdered(obj[key], k.order, opts, nxtPath);
						else out[key] = obj[key];
					} else if (k instanceof PropOrder._ArrayKey) {
						const nxtPath = `${path}[n].${key}`;
						if (k.fnGetOrder) out[key] = obj[key].map(it => this._getOrdered(it, k.fnGetOrder(), opts, nxtPath));
						else if (k.order) out[key] = obj[key].map(it => this._getOrdered(it, k.order, opts, nxtPath));
						else out[key] = obj[key];

						if (k.fnSort && out[key] instanceof Array) out[key].sort(k.fnSort);
					} else throw new Error(`Unimplemented!`);
				}
			}
		});

		// ensure any non-orderable keys are maintained
		const otherKeys = CollectionUtil.setDiff(keySet, seenKeys);
		[...otherKeys].forEach(k => {
			out[k] = obj[k];
			if (opts.fnUnhandledKey) opts.fnUnhandledKey(`${path}.${k}`);
		});

		return out;
	}

	static hasOrder (dataProp) { return !!PropOrder._PROP_TO_LIST[dataProp]; }
}

PropOrder._ObjectKey = class {
	/**
	 * @param key
	 * @param [opts] Options object.
	 * @param [opts.fnGetOrder] Function which gets the ordering to apply to objects with this key.
	 * Takes precedence over `.order`.
	 * @param [opts.order] Ordering to apply to objects with this key.
	 */
	constructor (key, opts) {
		opts = opts || {};

		this.key = key;
		this.fnGetOrder = opts.fnGetOrder;
		this.order = opts.order;
	}
};

PropOrder._ArrayKey = class {
	/**
	 * @param key
	 * @param [opts] Options object.
	 * @param [opts.fnGetOrder] Function which gets the ordering to apply to objects with this key.
	 * Takes precedence over `.order`.
	 * @param [opts.order] Ordering to apply to objects with this key.
	 * @param [opts.fnSort] Function to sort arrays with this key.
	 */
	constructor (key, opts) {
		opts = opts || {};

		this.key = key;
		this.fnGetOrder = opts.fnGetOrder;
		this.order = opts.order;
		this.fnSort = opts.fnSort;
	}
};

PropOrder._MONSTER = [
	"name",
	"shortName",
	"alias",
	"group",

	"isNpc",
	"isNamedCreature",

	"source",
	"sourceSub",
	"page",

	"srd",
	"otherSources",

	new PropOrder._ObjectKey("_copy", {
		order: [
			"name",
			"source",
			"_trait",
			new PropOrder._ObjectKey("_mod", {
				fnGetOrder: () => PropOrder._MONSTER__COPY_MOD
			}),
			"_preserve"
		]
	}),

	"level",
	"size",
	"sizeNote",
	"type",
	"alignment",

	"ac",
	"hp",
	"speed",

	"str",
	"dex",
	"con",
	"int",
	"wis",
	"cha",

	"save",
	"skill",
	"senses",
	"passive",
	"resist",
	"immune",
	"vulnerable",
	"conditionImmune",
	"languages",
	"cr",

	"spellcasting",
	"trait",
	"actionNote",
	"action",
	"reaction",
	"legendaryHeader",
	"legendaryActions",
	"legendary",
	"legendaryGroup",
	"variant",

	"environment",
	"fluff",
	"familiar",
	"dragonCastingColor",

	"tokenUrl",
	"soundClip",

	"altArt",

	new PropOrder._ArrayKey("traitTags", {fnSort: SortUtil.ascSortLowerSafe}),
	new PropOrder._ArrayKey("senseTags", {fnSort: SortUtil.ascSortLowerSafe}),
	new PropOrder._ArrayKey("actionTags", {fnSort: SortUtil.ascSortLowerSafe}),
	new PropOrder._ArrayKey("languageTags", {fnSort: SortUtil.ascSortLowerSafe}),
	new PropOrder._ArrayKey("damageTags", {fnSort: SortUtil.ascSortLowerSafe}),
	new PropOrder._ArrayKey("spellcastingTags", {fnSort: SortUtil.ascSortLowerSafe}),
	new PropOrder._ArrayKey("miscTags", {fnSort: SortUtil.ascSortLowerSafe}),
	new PropOrder._ArrayKey("conditionInflict", {fnSort: SortUtil.ascSortLowerSafe})
];
PropOrder._MONSTER__COPY_MOD = [
	"*",
	"_",
	...PropOrder._MONSTER
];
PropOrder._GENERIC_FLUFF = [
	"name",
	"source",

	"_copy",

	"_prependCopy",

	"entries",
	"images",

	"_appendCopy"
];
PropOrder._SPELL = [
	"name",

	"source",
	"page",
	"srd",

	"otherSources",

	"level",
	"school",
	"subschools",
	"time",
	"range",
	"components",
	"duration",
	"meta",

	"entries",
	"entriesHigherLevel",

	"scalingLevelDice",

	"damageResist",
	"damageImmune",
	"damageVulnerable",

	"damageInflict",
	"conditionInflict",

	"spellAttack",
	"savingThrow",
	"opposedCheck",

	"miscTags",
	"areaTags",

	"classes",
	"races",
	"backgrounds"
];
PropOrder._ACTION = [
	"name",

	"source",
	"page",
	"srd",

	"fromVariant",

	"time",

	"entries"
];
PropOrder._ADVENTURE = [
	"name",

	"id",
	"source",

	"image",
	"published",
	"storyline",
	"level",

	"contents"
];
PropOrder._BOOK = [
	"name",

	"id",
	"source",

	"image",
	"published",
	"author",

	"contents"
];
PropOrder._BACKGROUND = [
	"name",

	"source",
	"page",
	"srd",

	"additionalSources",
	"otherSources",

	new PropOrder._ObjectKey("_copy", {
		order: [
			"name",
			"source",
			"_trait",
			new PropOrder._ObjectKey("_mod", {
				fnGetOrder: () => PropOrder._BACKGROUND__COPY_MOD
			}),
			"_preserve"
		]
	}),

	"entries",

	"skillProficiencies",
	"languageProficiencies",
	"toolProficiencies"
];
PropOrder._BACKGROUND__COPY_MOD = [
	"*",
	"_",
	...PropOrder._BACKGROUND
];
PropOrder._TRAIT = [
	"name",

	"source",
	"page",

	"ref",

	"crMin",

	new PropOrder._ObjectKey("prerequisite", {
		order: PropOrder._MONSTER
	}),
	new PropOrder._ObjectKey("apply", {
		order: [
			new PropOrder._ObjectKey("_root", {
				order: PropOrder._MONSTER
			}),
			new PropOrder._ObjectKey("_mod", {
				fnGetOrder: () => PropOrder._MONSTER__COPY_MOD
			})
		]
	})
];
PropOrder._LEGENDARY_GROUP = [
	"name",
	"source",
	"lairActions",
	"regionalEffects"
];
PropOrder._CLASS = [
	"name",

	"source",
	"page",
	"srd",
	"isReprinted",

	"hd",
	"proficiency",

	"spellcastingAbility",
	"casterProgression",

	"startingProficiencies",
	"startingEquipment",

	"multiclassing",

	"classTableGroups",

	"classFeatures",

	"subclassTitle",
	new PropOrder._ArrayKey("subclasses", {
		fnGetOrder: () => PropOrder._CLASS__SUBCLASS
	}),

	"fluff"
];
PropOrder._CLASS__SUBCLASS = [
	"name",
	"shortName",

	"source",
	"page",
	"srd",
	"isReprinted",

	"spellcastingAbility",
	"casterProgression",

	"subclassTableGroups",
	"subclassFeatures"
];
PropOrder._LANGUAGE = [
	"name",
	"dialects",

	"source",
	"page",
	"srd",

	"additionalSources",

	"type",
	"typicalSpeakers",
	"script",

	"fonts",

	"entries"
];
PropOrder._CONDITION = [
	"name",

	"source",
	"page",
	"srd",

	"entries"
];
PropOrder._DISEASE = [
	"name",

	"source",
	"page",
	"srd",

	"entries"
];
PropOrder._CULT = [
	"name",

	"source",
	"page",
	"srd",

	"type",

	"goal",
	"cultists",
	"signaturespells",

	"entries"
];
PropOrder._BOON = [
	"name",

	"source",
	"page",
	"srd",

	"type",

	"ability",

	"goal",
	"cultists",
	"signaturespells",

	"entries"
];
PropOrder._DEITY = [
	"name",
	"reprintAlias",
	"altNames",

	"source",
	"page",
	"srd",

	"additionalSources",

	new PropOrder._ObjectKey("_copy", {
		order: [
			"name",
			"source",
			"pantheon",
			new PropOrder._ObjectKey("_mod", {
				fnGetOrder: () => PropOrder._DEITY__COPY_MOD
			})
		]
	}),

	// This is used as part of the ID key
	"pantheon",

	"customExtensionOf",

	"alignment",
	"title",
	"category",
	"domains",
	"province",
	"symbol",
	"symbolImg",

	"entries"
];
PropOrder._DEITY__COPY_MOD = [
	"*",
	"_",
	...PropOrder._DEITY
];
PropOrder._FEAT = [
	"name",

	"source",
	"page",
	"srd",

	"additionalSources",
	"otherSources",

	"prerequisite",
	"ability",

	"entries"
];
PropOrder._VEHICLE = [
	"name",

	"source",
	"page",
	"srd",

	"vehicleType",

	"size",
	"dimensions",
	"weight",

	"type",

	"capCreature",
	"capCrew",
	"capPassenger",
	"capCargo",

	"ac",
	"pace",
	"speed",

	"str",
	"dex",
	"con",
	"int",
	"wis",
	"cha",

	"hp",

	"immune",
	"conditionImmune",

	"hull",
	"control",
	"movement",
	"weapon",
	"other",

	"trait",
	"action",
	"actionStation",
	"reaction"
];
PropOrder._RACE_FLUFF = [
	"name",
	"source",

	"uncommon",
	"monstrous",

	"_excludeBaseEntries",
	"_excludeBaseImages",

	"_copy",

	"_prependCopy",

	"entries",
	"images",

	"_appendCopy"
];
PropOrder._ITEM = [
	"name",
	"namePrefix",
	"nameSuffix",

	"source",
	"page",
	"srd",

	"additionalSources",
	"otherSources",

	new PropOrder._ObjectKey("_copy", {
		order: [
			"name",
			"source",
			new PropOrder._ObjectKey("_mod", {
				fnGetOrder: () => PropOrder._ITEM__COPY_MOD
			})
		]
	}),

	"baseItem",

	"type",
	"scfType",
	"resist",

	"tier",
	"rarity",
	"wondrous",
	"reqAttune",
	"curse",
	"sentient",

	"weight",
	"weightMult",
	"weightNote",
	"value",
	"valueMult",
	"quantity",

	"weaponCategory",
	"age",

	"property",
	"range",
	"reload",

	"dmg1",
	"dmgType",
	"dmg2",

	"ac",
	"strength",

	"crew",
	"crewMin",
	"crewMax",
	"vehAc",
	"vehHp",
	"vehDmgThresh",
	"vehSpeed",
	"capPassenger",
	"capCargo",
	"travelCost",
	"shippingCost",

	"carryingCapacity",
	"speed",

	"ability",

	"bonusWeapon",
	"bonusWeaponAttack",
	"bonusWeaponDamage",
	"bonusSpellAttack",
	"bonusAc",
	"bonusSavingThrow",

	"recharge",
	"charges",

	"axe",
	"armor",
	"firearm",
	"focus",
	"poison",
	"staff",
	"stealth",
	"sword",
	"weapon",

	"entries",
	"additionalEntries",
	"items",

	"packContents",

	"attachedSpells",
	"lootTables"
];
PropOrder._ITEM__COPY_MOD = [
	"*",
	"_",
	...PropOrder._ITEM
];
PropOrder._VARIANT = [
	"name",
	"source",

	"type",

	"requires",
	"excludes",

	"entries",

	new PropOrder._ObjectKey("inherits", {
		order: PropOrder._ITEM
	})
];
PropOrder._OBJECT = [
	"name",

	"source",
	"page",
	"srd",

	"size",
	"type",

	"ac",
	"hp",
	"speed",

	"str",
	"dex",
	"con",
	"int",
	"wis",
	"cha",

	"senses",

	"immune",
	"resist",
	"vulnerable",

	"entries",
	"actionEntries"
];
PropOrder._OPTIONALFEATURE = [
	"name",

	"source",
	"page",
	"srd",
	"otherSources",

	"previousVersion",

	"featureType",

	"prerequisite",

	"entries"
];
PropOrder._PSIONIC = [
	"name",

	"source",
	"page",

	"type",
	"order",

	"entries",

	"focus",
	"modes"
];
PropOrder._REWARD = [
	"name",

	"source",
	"page",

	"type",

	"entries"
];
PropOrder._VARIANTRULE = [
	"name",

	"source",
	"page",
	"srd",

	"ruleType",

	"type",
	"entries"
];

PropOrder._PROP_TO_LIST = {
	"monster": PropOrder._MONSTER,
	"monsterFluff": PropOrder._GENERIC_FLUFF,
	"backgroundFluff": PropOrder._GENERIC_FLUFF,
	"conditionFluff": PropOrder._GENERIC_FLUFF,
	"itemFluff": PropOrder._GENERIC_FLUFF,
	"languageFluff": PropOrder._GENERIC_FLUFF,
	"vehicleFluff": PropOrder._GENERIC_FLUFF,
	"raceFluff": PropOrder._RACE_FLUFF,
	"spell": PropOrder._SPELL,
	"action": PropOrder._ACTION,
	"adventure": PropOrder._ADVENTURE,
	"book": PropOrder._BOOK,
	"background": PropOrder._BACKGROUND,
	"trait": PropOrder._TRAIT,
	"legendaryGroup": PropOrder._LEGENDARY_GROUP,
	"class": PropOrder._CLASS,
	"language": PropOrder._LANGUAGE,
	"condition": PropOrder._CONDITION,
	"disease": PropOrder._DISEASE,
	"cult": PropOrder._CULT,
	"boon": PropOrder._BOON,
	"deity": PropOrder._DEITY,
	"feat": PropOrder._FEAT,
	"vehicle": PropOrder._VEHICLE,
	"item": PropOrder._ITEM,
	"baseitem": PropOrder._ITEM,
	"variant": PropOrder._VARIANT,
	"itemGroup": PropOrder._ITEM,
	"object": PropOrder._OBJECT,
	"optionalfeature": PropOrder._OPTIONALFEATURE,
	"psionic": PropOrder._PSIONIC,
	"reward": PropOrder._REWARD,
	"variantrule": PropOrder._VARIANTRULE
};

if (typeof module !== "undefined") {
	module.exports = PropOrder;
}
