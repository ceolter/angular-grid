var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
import { Axis } from '../axis';
import { ChartAxisDirection } from './chartAxisDirection';
import { LinearScale } from '../scale/linearScale';
import { ContinuousScale } from '../scale/continuousScale';
import { POSITION, STRING_ARRAY, Validate } from '../util/validation';
export function flipChartAxisDirection(direction) {
    if (direction === ChartAxisDirection.X) {
        return ChartAxisDirection.Y;
    }
    else {
        return ChartAxisDirection.X;
    }
}
var ChartAxis = /** @class */ (function (_super) {
    __extends(ChartAxis, _super);
    function ChartAxis(moduleCtx, scale) {
        var _this = _super.call(this, scale) || this;
        _this.moduleCtx = moduleCtx;
        _this.keys = [];
        _this.direction = ChartAxisDirection.Y;
        _this.boundSeries = [];
        _this.includeInvisibleDomains = false;
        _this.modules = {};
        _this._position = 'left';
        return _this;
    }
    Object.defineProperty(ChartAxis.prototype, "type", {
        get: function () {
            return this.constructor.type || '';
        },
        enumerable: false,
        configurable: true
    });
    ChartAxis.prototype.useCalculatedTickCount = function () {
        // We only want to use the new algorithm for number axes. Category axes don't use a
        // calculated or user-supplied tick-count, and time axes need special handling depending on
        // the time-range involved.
        return this.scale instanceof LinearScale;
    };
    Object.defineProperty(ChartAxis.prototype, "position", {
        get: function () {
            return this._position;
        },
        set: function (value) {
            if (this._position !== value) {
                this._position = value;
                switch (value) {
                    case 'top':
                        this.direction = ChartAxisDirection.X;
                        this.rotation = -90;
                        this.label.mirrored = true;
                        this.label.parallel = true;
                        break;
                    case 'right':
                        this.direction = ChartAxisDirection.Y;
                        this.rotation = 0;
                        this.label.mirrored = true;
                        this.label.parallel = false;
                        break;
                    case 'bottom':
                        this.direction = ChartAxisDirection.X;
                        this.rotation = -90;
                        this.label.mirrored = false;
                        this.label.parallel = true;
                        break;
                    case 'left':
                        this.direction = ChartAxisDirection.Y;
                        this.rotation = 0;
                        this.label.mirrored = false;
                        this.label.parallel = false;
                        break;
                }
                if (this.axisContext) {
                    this.axisContext.position = value;
                    this.axisContext.direction = this.direction;
                }
            }
        },
        enumerable: false,
        configurable: true
    });
    ChartAxis.prototype.calculateDomain = function () {
        var _a;
        var _b = this, direction = _b.direction, boundSeries = _b.boundSeries, includeInvisibleDomains = _b.includeInvisibleDomains;
        if (this.linkedTo) {
            this.dataDomain = this.linkedTo.dataDomain;
        }
        else {
            var domains_1 = [];
            boundSeries
                .filter(function (s) { return includeInvisibleDomains || s.isEnabled(); })
                .forEach(function (series) {
                domains_1.push(series.getDomain(direction));
            });
            var domain = (_a = new Array()).concat.apply(_a, __spread(domains_1));
            this.dataDomain = this.normaliseDataDomain(domain);
        }
    };
    ChartAxis.prototype.normaliseDataDomain = function (d) {
        return d;
    };
    ChartAxis.prototype.isAnySeriesActive = function () {
        var _this = this;
        return this.boundSeries.some(function (s) { return _this.includeInvisibleDomains || s.isEnabled(); });
    };
    ChartAxis.prototype.getLayoutState = function () {
        return __assign({ rect: this.computeBBox(), gridPadding: this.gridPadding, seriesAreaPadding: this.seriesAreaPadding, tickSize: this.tick.size }, this.layout);
    };
    ChartAxis.prototype.addModule = function (module) {
        var _this = this;
        if (this.modules[module.optionsKey] != null) {
            throw new Error('AG Charts - module already initialised: ' + module.optionsKey);
        }
        if (this.axisContext == null) {
            var keys = function () {
                return _this.boundSeries
                    .map(function (s) { return s.getKeys(_this.direction); })
                    .reduce(function (keys, seriesKeys) {
                    keys.push.apply(keys, __spread(seriesKeys));
                    return keys;
                }, []);
            };
            this.axisContext = {
                axisId: this.id,
                position: this.position,
                direction: this.direction,
                continuous: this.scale instanceof ContinuousScale,
                keys: keys,
                scaleValueFormatter: function (specifier) { var _a, _b, _c; return (_c = (_b = (_a = _this.scale).tickFormat) === null || _b === void 0 ? void 0 : _b.call(_a, { specifier: specifier })) !== null && _c !== void 0 ? _c : undefined; },
                scaleBandwidth: function () { var _a; return (_a = _this.scale.bandwidth) !== null && _a !== void 0 ? _a : 0; },
                scaleConvert: function (val) { return _this.scale.convert(val); },
                scaleInvert: function (val) { var _a, _b, _c; return (_c = (_b = (_a = _this.scale).invert) === null || _b === void 0 ? void 0 : _b.call(_a, val)) !== null && _c !== void 0 ? _c : undefined; },
            };
        }
        var moduleMeta = module.initialiseModule(__assign(__assign({}, this.moduleCtx), { parent: this.axisContext }));
        this.modules[module.optionsKey] = moduleMeta;
        this[module.optionsKey] = moduleMeta.instance;
    };
    ChartAxis.prototype.removeModule = function (module) {
        var _a, _b;
        (_b = (_a = this.modules[module.optionsKey]) === null || _a === void 0 ? void 0 : _a.instance) === null || _b === void 0 ? void 0 : _b.destroy();
        delete this.modules[module.optionsKey];
        delete this[module.optionsKey];
    };
    ChartAxis.prototype.isModuleEnabled = function (module) {
        return this.modules[module.optionsKey] != null;
    };
    ChartAxis.prototype.destroy = function () {
        var e_1, _a;
        _super.prototype.destroy.call(this);
        try {
            for (var _b = __values(Object.entries(this.modules)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), key = _d[0], module_1 = _d[1];
                module_1.instance.destroy();
                delete this.modules[key];
                delete this[key];
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    __decorate([
        Validate(STRING_ARRAY)
    ], ChartAxis.prototype, "keys", void 0);
    __decorate([
        Validate(POSITION)
    ], ChartAxis.prototype, "_position", void 0);
    return ChartAxis;
}(Axis));
export { ChartAxis };
