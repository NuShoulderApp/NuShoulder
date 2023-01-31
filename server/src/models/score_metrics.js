const score_metrics_db = function(sequelize, DataTypes) {
	return sequelize.define('score_metrics', {
		score_metric_ID: {
			type: DataTypes.INTEGER(10).UNSIGNED,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		score_category_ID: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		},
		score_source_ID: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		},
		score_metric_name: {
			type: DataTypes.STRING(100),
			allowNull: false
		},
		score_max: {
			type: DataTypes.FLOAT(),
			allowNull: false
		},
		score_min: {
			type: DataTypes.FLOAT(),
			allowNull: false
		},
		passing_score: {
			type: DataTypes.FLOAT(),
			allowNull: false
		},
		score_percentage_of_category: {
			type: DataTypes.FLOAT(),
			allowNull: false
		},
        score_units: {
			type: DataTypes.STRING(100),
			allowNull: false
		},
		pass_fail: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		},
		allow_partial_score: {
			type: DataTypes.BOOLEAN,
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
		tableName: 'score_metrics',
		timestamps: false
	});
};

export default score_metrics_db