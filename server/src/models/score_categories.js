const score_categories_db = function(sequelize, DataTypes) {
	return sequelize.define('score_categories', {
		score_category_ID: {
			type: DataTypes.INTEGER(10).UNSIGNED,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		score_category_name: {
			type: DataTypes.STRING(100),
			allowNull: false
		},
		score_category_percentage: {
			type: DataTypes.FLOAT(),
			allowNull: false
		},
		active: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		},
		archived: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		},
		creator_ID: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		},
		archiver_ID: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		},
		date_created: {
			type: DataTypes.DATE,
			allowNull: false
		},
		date_archived: {
			type: DataTypes.DATE,
			allowNull: true
		}
	}, {
		tableName: 'score_categories',
		timestamps: false
	});
};

export default score_categories_db