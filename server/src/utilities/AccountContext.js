// import standard database connection object
import { getKnex } from "../db_knex";

import { createS3Interface } from '../aws/setup';

// Cache the account information.
let accountCache = {};

// Get the default SYSTEM knex connection.
const knex = getKnex();

// Value in secondes for how long to cache the information.
const MAX_CACHE_AGE_SECONDS = 60 * 15;

// function to get setting by name.
function getSettingValue(settings, setting_name) {
	let entry = (settings.find((s) => s.name === setting_name) || {});
	return entry.value;
}

// Function to get the account information
export async function GetAccountContext(url) {
	// Split the array by .
	const urlAry = url.split(".");

	// We only want to use the main domain (no TLD or subs)
	let domain = "";
	let subDomains = "";

	// If the url has more than two domains, get the sub domains out.
	if( urlAry.length > 2 ) {
		// Last two entries in the domain should match the url field in the acounts table.
		domain = urlAry.slice(-2).join(".");
		// The rest of the items are subdomains.
		subDomains = urlAry.slice(0, -2);
	} else {
		domain = url;
	}

	if (domain.includes(':')){
		domain = domain.substring(0,domain.indexOf(':'));
	}
	// Check the cache and, if there is a match, check to make sure the record is not expired.
	if(accountCache.hasOwnProperty(domain) === false || process.hrtime(accountCache[domain].dateCached)[0] > MAX_CACHE_AGE_SECONDS) {
		// We will now look up the account based on the url.
		const Account = await knex("accounts").where("url", domain).first();

		// If no account was found we will return an empty account object.
		if(Account === undefined) {
			return {
				accountId: 0,
				accountName: "",
				active: 0,
				url: url,
				Settings: [],
				subDomains: ""
			};
		}

		// Get the account settings, map the value/default value to get the actual value for the account/setting combination.
		const Settings = await knex("accountsSettings")
			.leftJoin("accountsSettingsOverrides", function() {
				// AccountSettingOverride.accountId should either be NULL (no override for this account) or contain Account.accountId (override exists)
				this.on('accountsSettings.accountSettingId', 'accountsSettingsOverrides.accountSettingId').on('accountsSettingsOverrides.accountId', '=', Account.accountId)
			})
			// These next two where clauses dont't have any impact on the final result, but I'm leaving them in as extra checks
			.whereNull("accountsSettingsOverrides.accountId")
			.orWhere("accountsSettingsOverrides.accountId", Account.accountId)
			.select(
				"accountsSettings.value as defaultValue",
				"accountsSettings.name",
				"accountsSettings.json",
				"accountsSettingsOverrides.value as value"
			).map((setting) => ({ ...setting, value: setting.value === null ?  setting.defaultValue : setting.value }));

		Settings.getSettingValue = function (setting_name) {
			const setting = this.find((s) => s.name === setting_name) || { json: 0 };

			if( setting.json === 1 ) {
				try {
					return JSON.parse(setting.value);
				} catch(e) {
					return setting.value;
				}
			} else {
				return setting.value;
			}
		};

		// create an instance of the amazon s3 service interface object for this account, to cache with settings and other account info
		const s3 = createS3Interface();

		// Find a timezone setting, if one is not found, use SYSTEM
		// const timezone = Settings.find(({name}) =>  name === "timezone" ) || { value: "SYSTEM" };
		//timezone.value
		
		// Get a Knex object for the specific timezone.
		const AccountKnex = getKnex(Account.accountPrefix, 'UTC');

		// Add a new item to the cache.
		accountCache[domain] = {
			dateCached: process.hrtime(),
			Account:  {
				...Account,
				subDomains,
				Settings,
				requestUrl: url,
				getSettingValue: getSettingValue.bind(null, Settings),
				s3,
				knex: AccountKnex
			}
		}
	}

	// return the Account portion of the record.
	return accountCache[domain].Account;
}
