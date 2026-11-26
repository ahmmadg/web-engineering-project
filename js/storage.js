const KEY_PREFIX = 'movieReview_';

function getLocalStorage() {
    if (!globalThis.localStorage) {
        throw new Error('localStorage is not available.');
    }

    return globalThis.localStorage;
}

function getTableKey(table) {
    if (typeof table !== 'string' || table.trim() === '') {
        throw new TypeError('Table name must be a non-empty string.');
    }

    return KEY_PREFIX + table;
}

function readRows(table) {
    const serialized = getLocalStorage().getItem(getTableKey(table));
    if (!serialized) {
        return [];
    }

    try {
        const rows = JSON.parse(serialized);
        return Array.isArray(rows) ? rows : [];
    } catch (error) {
        return [];
    }
}

function getNextId(table, rows) {
    const counterKey = getTableKey(table) + '_nextId';
    const serialized = getLocalStorage().getItem(counterKey);
    let counter = 0;

    if (serialized) {
        try {
            counter = JSON.parse(serialized);
        } catch (error) {
            counter = 0;
        }
    }

    const highestId = rows.reduce(function (highest, row) {
        return row && Number.isSafeInteger(row.id) && row.id > highest
            ? row.id
            : highest;
    }, 0);

    if (!Number.isSafeInteger(counter) || counter < 1) {
        counter = 1;
    }

    return Math.max(counter, highestId + 1);
}

function saveRows(table, rows) {
    getLocalStorage().setItem(getTableKey(table), JSON.stringify(rows));
}

const storage = {
        getAll: function (table) {
            return readRows(table);
        },

        getById: function (table, id) {
            return readRows(table).find(function (row) {
                return row && row.id === id;
            }) || null;
        },

        insert: function (table, record) {
            if (!record || typeof record !== 'object' || Array.isArray(record)) {
                throw new TypeError('Record must be an object.');
            }

            var rows = readRows(table);
            var id = getNextId(table, rows);
            var counterKey = getTableKey(table) + '_nextId';
            var inserted = Object.assign({}, record, { id: id });

            getLocalStorage().setItem(counterKey, JSON.stringify(id + 1));
            rows.push(inserted);
            saveRows(table, rows);

            return inserted;
        },

        update: function (table, id, changes) {
            if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
                throw new TypeError('Changes must be an object.');
            }

            var rows = readRows(table);
            var index = rows.findIndex(function (row) {
                return row && row.id === id;
            });

            if (index === -1) {
                return null;
            }

            rows[index] = Object.assign({}, rows[index], changes, { id: rows[index].id });
            saveRows(table, rows);
            return rows[index];
        },

        remove: function (table, id) {
            var rows = readRows(table);
            var remainingRows = rows.filter(function (row) {
                return !row || row.id !== id;
            });

            if (remainingRows.length === rows.length) {
                return false;
            }

            saveRows(table, remainingRows);
            return true;
        },

        find: function (table, predicate) {
            if (typeof predicate !== 'function') {
                throw new TypeError('Find requires a predicate function.');
            }

            return readRows(table).filter(predicate);
        }
};

export default storage;