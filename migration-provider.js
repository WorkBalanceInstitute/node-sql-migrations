var fs = require('fs');
var path = require('path');

module.exports = function (config) {
    return {
        getMigrationsList: function () {
            return fs.readdirSync(config.migrationsDir);
        },
        /**
         * @param {Array} migrationsList list of filenames
         * @param {Array<Number>} ids of applied migration from db table
         * @return {Array} of migration filenames that have not been applied
         */

        getSql: function (migration) {
            var sql = fs.readFileSync(path.join(config.migrationsDir, migration)).toString();

            if (migrationIsYamlFile()) {
                sql = parseYaml(sql)
            }

            Object.keys(config.parameters || {}).forEach(function (key) {
                sql = sql.replace(new RegExp(escapeRegExp(key), "g"), config.parameters[key]);
            });

            return sql;

            function migrationIsYamlFile() {
                return migration.indexOf(".yaml") !== -1
            }

            function parseYaml(sql) {
                const joinedSqlStrings = `${(sql.match(/sql: ((?!type:).)+/gs) || [])
                  .map(s => {
                    const cleanedString = s
                      .replace(/sql: "/g, 'sql: ')
                      .split('sql: ')[1]
                      .replace(/(\n|\\n|\|-)/g, '')
                      .replace(/\\"/g, '"')
                      .replace(/\\/g, '')
              
                    const stringHasEvenNumberOfQuoteCharacters = (cleanedString.split('"').length - 1) % 2 === 0
                    return stringHasEvenNumberOfQuoteCharacters
                      ? cleanedString
                      : cleanedString.substr(0, cleanedString.lastIndexOf('"'))
                  })
                  .join(';\n')};`
              
                return joinedSqlStrings.replace(/;(\s)*;/gs, ';')
              }
        }
    };
};

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
