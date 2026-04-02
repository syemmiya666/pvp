const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    type: { type: String, required: true },
    count: { type: Number, default: 0 }
});

CounterSchema.index({ guildId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Counter', CounterSchema);

