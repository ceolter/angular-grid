"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var relationship_1 = require("./relationship");
var relationshipsFactory = {
    getTemplate: function (c) {
        var children = c.map(function (relationship) { return relationship_1.default.getTemplate(relationship); });
        return {
            name: "Relationships",
            properties: {
                rawMap: {
                    xmlns: "http://schemas.openxmlformats.org/package/2006/relationships"
                }
            },
            children: children
        };
    }
};
exports.default = relationshipsFactory;
