
// IMPORTANT: When adding a new type here, also add it to the id_type_map in the index.js file on the Client to make it work with the Apollo cache
const typeDefs = [
	`scalar Date`,
	`scalar DateTime`,
	`scalar JSON`,
	`
		schema {
			query: RootQuery
			mutation: RootMutation
			subscription: RootSubscription
		}
	`,
	"type RootMutation",
	"type RootQuery",
	"type RootSubscription",
	// IMPORTANT: When adding a new type here, also add it to the id_type_map in the index.js file on the Client to make it work with the Apollo cache
	require('./Account').default,
	require('./AccountSetting').default,
	require('./Address').default,
	require('./AddressType').default,
	require('./Announcement').default,
	require('./Burial').default,
	require('./BurialLog').default,
	require('./Company').default,
	require('./CompanyAddress').default,
	require('./CompanyDefaultProduct').default,
	require('./CompanyDepartment').default,
	require('./CompanyPhone').default,
	require('./CompanyType').default,
	require('./CompanyUser').default,
	require('./Country').default,
	require('./CreditCard').default,
	require('./CreditCardCharge').default,
	require('./Cremation').default,
	require('./CremationLog').default,
	require("./DeliveryLog").default,
	require("./DeliveryLogOrder").default,
	require('./Email').default,
	require('./File').default,
	require('./Invoice').default,
	require('./Job').default,
	require('./Language').default,
	require('./Log').default,
	require('./LogOrderActivity').default,
	require('./Machine').default,
	require('./Memorial').default,
	require('./MemorialImages').default,
	require('./MemorialStatus').default,
	require('./Module').default,
	require('./Order').default,
	require('./OrderComment').default,
	require('./OrderFile').default,
	require('./OrderHold').default,
	require('./OrderProduct').default,
	require('./OrderProductProductOption').default,
	require('./OrderServiceStatus').default,
	require('./OrderStatus').default,
	require('./Payment').default,
	require('./Permission').default,
	require('./PermissionDefault').default,
	require('./Pet').default,
	require('./PetReferenceNumber').default,
	require('./PhoneType').default,
	require('./Printable').default,
	require('./PrintableLog').default,
	require('./PrintableOrder').default,
	require('./Product').default,
	require('./ProductAccount').default,
	require('./ProductAttribute').default,
	require('./ProductCompanyPromotion').default,
	require('./ProductImage').default,
	require('./ProductCategory').default,
	require('./ProductCompanyPrice').default,
	require('./ProductGroup').default,
	require('./ProductMaterial').default,
	require('./ProductOption').default,
	require('./ProductOptionType').default,
	require('./ProductOptionValue').default,
	require('./ProductSpecies').default,
	require('./ProductType').default,
	require('./ProductVariationType').default,
	require('./ProductVariationValue').default,
	require('./ProductView').default,
	require("./Response").default,
	require("./Route").default,
	require("./Session").Session,
	require('./Signature').default,
	require('./Species').default,
	require('./State').default,
	require('./Testimonial').default,
	require('./TestimonialStatus').default,
	require('./Translation').default,
	require('./TranslationFilter').default,
	require('./TranslationGroups').default,
	require('./User').default,
	require('./UserAddress').default,
	require('./UserLogin').default,
	require('./UserPermission').default,
	require('./UserPhone').default,
	require('./UserType').default
]

// IMPORTANT: When adding a new type here, also add it to the id_type_map in the index.js file on the Client to make it work with the Apollo cache

export default typeDefs