const MESSAGE_TYPES = ['success', 'danger', 'info'];
    var DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

    function parseDate(value) {
        var date;

        if (value instanceof Date) {
            date = new Date(value.getTime());
        } else if (typeof value === 'string') {
            var dateOnlyMatch = DATE_ONLY_PATTERN.exec(value);
            if (dateOnlyMatch) {
                date = new Date(
                    Number(dateOnlyMatch[1]),
                    Number(dateOnlyMatch[2]) - 1,
                    Number(dateOnlyMatch[3])
                );
                if (date.getFullYear() !== Number(dateOnlyMatch[1]) ||
                    date.getMonth() !== Number(dateOnlyMatch[2]) - 1 ||
                    date.getDate() !== Number(dateOnlyMatch[3])) {
                    throw new RangeError('Date string is invalid.');
                }
            } else {
                date = new Date(value);
            }
        } else if (typeof value === 'number') {
            date = new Date(value);
        } else {
            throw new TypeError('Date must be a Date, string, or timestamp.');
        }

        if (Number.isNaN(date.getTime())) {
            throw new RangeError('Date is invalid.');
        }

        return date;
    }

    function toDateInputValue(date) {
        var year = String(date.getFullYear()).padStart(4, '0');
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var day = String(date.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    }

export function today() {
        return toDateInputValue(new Date());
    }

export function nextYear(value) {
        var date = value === undefined ? new Date() : parseDate(value);
        var year = date.getFullYear() + 1;
        var month = date.getMonth();
        var day = date.getDate();
        var result = new Date(year, month, day);

        if (result.getMonth() !== month) {
            result.setDate(0);
        }

        return toDateInputValue(result);
    }

export function formatDate(value, options) {
        var date = parseDate(value);
        var formatOptions = options || {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };

        return new Intl.DateTimeFormat(undefined, formatOptions).format(date);
    }

export function setText(element, text) {
        if (!element || !('textContent' in element)) {
            throw new TypeError('A text-capable element is required.');
        }

        element.textContent = text === null || text === undefined ? '' : String(text);
        return element;
    }

export function showMessage(element, text, type) {
        if (!element || !element.classList || typeof element.setAttribute !== 'function') {
            throw new TypeError('A message element is required.');
        }
        if (MESSAGE_TYPES.indexOf(type) === -1) {
            throw new TypeError('Message type must be success, danger, or info.');
        }

        setText(element, text);
        element.classList.add('alert');
        MESSAGE_TYPES.forEach(function (messageType) {
            element.classList.remove('alert--' + messageType);
        });
        element.classList.add('alert--' + type);
        element.setAttribute('role', 'alert');
        return element;
    }

const utils = {
    today,
    nextYear,
    formatDate,
    showMessage,
    setText
};

export default utils;