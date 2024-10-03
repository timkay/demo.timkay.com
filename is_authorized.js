var test_data = [dict ({'datetime': '2024-09-29 15:12:01', 'description': 'McDonalds #4321, Lansing MI', 'amount': '12.54', 'balance': '833.23', 'mcc': '5814'}), dict ({'datetime': '2024-09-30 18:15:42', 'description': 'McDonalds #4321, Lansing MI', 'amount': '15.99', 'balance': '813.23', 'mcc': '5814'}), dict ({'datetime': '2024-09-30 15:12:01', 'description': 'Ronalds #1, Texas MI', 'amount': '1200.00', 'balance': '604.17', 'mcc': '7692'}), dict ({'datetime': '2024-09-30 77:19:25', 'description': 'Southwest / Dallas, TX', 'amount': '237.90', 'balance': '604.17', 'mcc': '3006'}), dict ({'datetime': '2024-10-01 15:12:01', 'description': 'Peets 1744, Ann Arbor MIUS', 'amount': '6.65', 'balance': '907.68', 'mcc': '5812'})];
for (var data of test_data) {
        var __left0__ = data ['datetime'].py_split (' ');
        data ['date'] = __left0__ [0];
        data ['time'] = __left0__ [1];
}
var is_authorized = function (rules, data, all) {
        if (typeof all == 'undefined' || (all != null && all.hasOwnProperty ("__kwargtrans__"))) {;
                var all = true;
        };
        if (!(rules) || !(len (rules))) {
                return all;
        }
        for (var rule of rules) {
                var term = null;
                var metric = rule ['metric'];
                if (!(metric) || metric == 'Choose:') {
                        continue;
                }
                if (!(rule ['active'])) {
                        continue;
                }
                if (metric == 'All') {
                        var term = is_authorized (rule ['rules'], data, true);
                }
                else if (metric == 'Any') {
                        var term = is_authorized (rule ['rules'], data, false);
                }
                else if (metric == 'None') {
                        var term = !(is_authorized (rule ['rules'], data, true));
                }
                else if (metric == 'JIT') {
                        var term = true;
                }
                else {
                        var op = rule ['op'];
                        var value = data [metric];
                        var expr = rule ['params'] [0];
                        var expr1 = (op == 'between' ? rule ['params'] [1] : null);
                        if (metric == 'amount' || metric == 'balance') {
                                var evaluate = function (expr) {
                                        if (expr == 'balance') {
                                                return float (data ['balance']);
                                        }
                                        return float (expr || '0.00');
                                };
                                var value = evaluate (value);
                                var expr = evaluate (expr);
                                var expr1 = evaluate (expr1);
                        }
                        if (metric == 'amount' || metric == 'balance' || metric == 'datetime' || metric == 'date' || metric == 'time') {
                                if (op == 'between') {
                                        var term = expr <= value && value <= expr1;
                                }
                                else if (op == '<') {
                                        var term = value < expr;
                                }
                                else if (op == '<=') {
                                        var term = value <= expr;
                                }
                                else if (op == '=') {
                                        var term = value == expr;
                                }
                                else if (op == '>=') {
                                        var term = value >= expr;
                                }
                                else if (op == '>') {
                                        var term = value > expr;
                                }
                                else {
                                        return false;
                                }
                        }
                        else if (metric == 'mcc') {
                                var isin = data ['mcc'] == expr;
                                var term = op == 'is-in' && isin || op == 'is-not-in' && !(isin);
                        }
                        else if (metric == 'description') {
                                var cont = __in__ (expr.lower (), data.description.lower ());
                                var term = op == 'contains' && cont || op == 'does-not-contain' && !(cont);
                        }
                        else {
                                return false;
                        }
                }
                if (all == true && term == false) {
                        return false;
                }
                if (all == false && term == true) {
                        return true;
                }
        }
        return all;
};