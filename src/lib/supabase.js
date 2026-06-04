/**
 * Custom Mock Supabase Client.
 * Routes all database queries through our FastAPI backend, which handles Firestore.
 * Supports chainable query syntax: select, insert, update, delete, eq, in, order, limit, single.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const TOKEN_KEY = 'ma_session_token';

class SupabaseQueryBuilder {
    constructor(tableName) {
        this.tableName = tableName;
        this.operation = 'select'; // select, insert, update, delete
        this.payload = null;
        this.filters = {};
        this.orderByField = null;
        this.orderByAscending = true;
        this.limitVal = null;
        this.isSingle = false;
    }

    select(fields = '*') {
        if (this.operation !== 'insert' && this.operation !== 'update' && this.operation !== 'delete') {
            this.operation = 'select';
        }
        return this;
    }

    insert(data) {
        this.operation = 'insert';
        this.payload = data;
        return this;
    }

    update(data) {
        this.operation = 'update';
        this.payload = data;
        return this;
    }

    delete() {
        this.operation = 'delete';
        return this;
    }

    eq(field, value) {
        this.filters[field] = value;
        return this;
    }

    in(field, values) {
        if (Array.isArray(values)) {
            this.filters[`${field}_in`] = values.join(',');
        }
        return this;
    }

    order(field, { ascending = true } = {}) {
        this.orderByField = field;
        this.orderByAscending = ascending;
        return this;
    }

    limit(val) {
        this.limitVal = val;
        return this;
    }

    single() {
        this.isSingle = true;
        return this;
    }

    async execute() {
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            const headers = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const url = new URL(`${API_BASE}/db/${this.tableName}`);
            
            // Build query params for filters, order, limit
            if (this.operation === 'select') {
                Object.entries(this.filters).forEach(([k, v]) => {
                    url.searchParams.append(`filter_${k}`, v);
                });
                if (this.orderByField) {
                    url.searchParams.append('order_by', this.orderByField);
                    url.searchParams.append('order_dir', this.orderByAscending ? 'asc' : 'desc');
                }
                if (this.limitVal) {
                    url.searchParams.append('limit', this.limitVal);
                }
            }

            let method = 'GET';
            let body = null;

            if (this.operation === 'insert') {
                method = 'POST';
                // Supabase insert accepts an array of rows or a single object.
                // We handle both, but our Firestore backend expects a single dictionary payload.
                const dataToInsert = Array.isArray(this.payload) ? this.payload[0] : this.payload;
                body = JSON.stringify(dataToInsert);
            } else if (this.operation === 'update') {
                method = 'PUT';
                body = JSON.stringify(this.payload);
                // Append filters (like id) to query parameters
                Object.entries(this.filters).forEach(([k, v]) => {
                    url.searchParams.append(`filter_${k}`, v);
                });
            } else if (this.operation === 'delete') {
                method = 'DELETE';
                Object.entries(this.filters).forEach(([k, v]) => {
                    url.searchParams.append(`filter_${k}`, v);
                });
            }

            const response = await fetch(url.toString(), {
                method,
                headers,
                body,
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                return { data: null, error: new Error(errData.detail || `HTTP ${response.status}`) };
            }

            let resData = await response.json();
            
            // If the query builder expected a single object (e.g. via .single() or from select where id)
            if (this.isSingle) {
                if (Array.isArray(resData)) {
                    resData = resData.length > 0 ? resData[0] : null;
                }
            }
            
            // If the insert operation expects to return an array of inserted records
            if (this.operation === 'insert' && !Array.isArray(resData)) {
                resData = [resData];
            }

            return { data: resData, error: null };
        } catch (err) {
            console.error(`Mock Supabase Error [${this.operation}] on ${this.tableName}:`, err);
            return { data: null, error: err };
        }
    }

    // Thenable implementation to support direct await on the builder chain
    then(onFulfilled, onRejected) {
        return this.execute().then(onFulfilled, onRejected);
    }
}

export const supabase = {
    from(tableName) {
        return new SupabaseQueryBuilder(tableName);
    },
    auth: {
        async getSession() {
            return { data: { session: null }, error: null };
        },
        onAuthStateChange() {
            return { data: { subscription: { unsubscribe: () => {} } } };
        }
    }
};
