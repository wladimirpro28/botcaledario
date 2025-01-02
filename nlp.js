const { NlpManager } = require('@nlpjs/basic');

const manager = new NlpManager({ languages: ['es'], forceNER: true });

// Entrenamiento
manager.addDocument('es', 'hola', 'greeting');
manager.addDocument('es', 'buenas tardes', 'greeting');
manager.addDocument('es', 'quiero agendar una cita', 'appointment');
manager.addDocument('es', 'necesito un turno', 'appointment');
manager.addDocument('es', 'no entiendo', 'unknown');

manager.addAnswer('es', 'greeting', '¡Hola! ¿En qué puedo ayudarte?');
manager.addAnswer('es', 'appointment', 'Claro, ¿para qué fecha necesitas agendar la cita?');
manager.addAnswer('es', 'unknown', 'Lo siento, no entendí eso. ¿Puedes reformularlo?');

const trainNlp = async () => {
    await manager.train();
    manager.save();
};

const processMessage = async (message) => {
    const response = await manager.process('es', message);
    return response;
};

module.exports = { trainNlp, processMessage };
