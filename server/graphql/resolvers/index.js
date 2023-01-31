import { GraphQLDate, GraphQLDateTime } from 'graphql-iso-date'
import GraphQLJSON from 'graphql-type-json'

const resolvers = {
	Date: GraphQLDate,
	DateTime: GraphQLDateTime,
	JSON: GraphQLJSON,
	RootMutation: require('./RootMutation').default,
	RootQuery: require('./RootQuery').default,
	RootSubscription: require('./RootSubscription').default,

	// (sub)Type specific resolvers.
	Account: require('./Account').AccountSubResolvers,
	AccountSetting: require('./AccountSetting').AccountSettingSubResolvers,

	Announcement: require('./Announcement').AnnouncementSubResolvers,

	BurialLog: require('./BurialLog').BurialLogSubResolvers,

	Company: require('./Company').CompanySubResolvers,
	CompanyAddress: require('./CompanyAddress').CompanyAddressSubResolvers,
	CompanyPhone: require('./CompanyPhone').CompanyPhoneSubResolvers,
	CompanyUser: require('./CompanyUser').CompanyUserSubResolvers,
	Country: require('./Country').CountrySubResolvers,

	Cremation: require('./Cremation').CremationSubResolvers,
	CremationOrderDetail: require('./Cremation').CremationSubResolvers,
	CremationLog: require('./CremationLog').CremationLogSubResolvers,

	DeliveryLog: require("./DeliveryLog").SubResolvers,
	DeliveryLogOrder: require("./DeliveryLogOrder").SubResolvers,

	File: require("./File").SubResolvers,

	Invoice: require("./Invoice").SubResolvers,

	Job: require("./Job").SubResolvers,

	Machine: require('./Machine').SubResolvers,

	Memorial: require('./Memorial').SubResolvers.Memorial,
	MemorialImage: require('./MemorialImages').SubResolvers.MemorialImage,

	Order: require('./Order').SubResolvers,
	OrderFile: require('./OrderFile').SubResolvers,
	Pet: require('./Pet').SubResolvers.Pet,

	Printable: require('./Printable').SubResolvers,
	PrintableLog: require('./PrintableLog').SubResolvers,
	PrintableOrder: require('./PrintableOrder').SubResolvers,

	Product: require('./Product').SubResolvers,
	ProductOption: require("./ProductOption").SubResolvers,

	ProductCompanyPromotion: require("./ProductCompanyPromotion").SubResolvers,
	ProductImage: require('./ProductImage').SubResolvers,
	ProductMemorialization: require('./ProductMemorialization').SubResolvers,

	Permission: require('./Permission').PermissionSubResolvers,
	PermissionDefault: require("./PermissionDefault").PermissionDefaultSubResolvers,

	Route: require('./Route').SubResolvers,

	Testimonial: require('./Testimonial').TestimonialSubResolvers,
	Translation: require('./Translation').TranslationSubResolvers.Translation,

	SignatureSaveResult: require('./Signature').SubResolvers,

	User: require('./User').UserSubResolvers,
	UserLogin: require("./UserLogin").SubResolvers,
	UserPermission: require('./UserPermission').UserPermissionSubResolver
}

export default resolvers
