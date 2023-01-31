const score_sources_db = function(sequelize, DataTypes) {
	return sequelize.define('score_sources', {
		score_source_ID: {
			type: DataTypes.INTEGER(10).UNSIGNED,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		source_name: {
			type: DataTypes.STRING(100),
			allowNull: false
		}
	}, {
		tableName: 'score_sources',
		timestamps: false
	});
};

export default score_sources_db