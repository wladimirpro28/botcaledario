const { NlpManager } = require('@nlpjs/basic');

// Crear y configurar el bot
const manager = new NlpManager({ languages: ['es'], forceNER: true });

// Entrenar el bot
const trainBot = async () => {
    // Documentos (Preguntas que reconoce el bot)
    manager.addDocument('es', 'quiero agendar una cita', 'agenda.cita');
    manager.addDocument('es', 'necesito reservar un turno', 'agenda.cita');
    manager.addDocument('es', 'quiero un turno', 'agenda.cita');
    manager.addDocument('es', 'hola', 'saludo.hola');
    manager.addDocument('es', 'buenos días', 'saludo.hola');
    manager.addDocument('es', 'adiós', 'saludo.adios');

    // Respuestas (Lo que el bot dirá)
    manager.addAnswer('es', 'agenda.cita', 'Claro, ¿qué fecha tenías en mente?');
    manager.addAnswer('es', 'saludo.hola', '¡Hola! ¿En qué puedo ayudarte hoy?');
    manager.addAnswer('es', 'saludo.adios', 'Adiós, que tengas un buen día.');

    // Entrenamiento del modelo
    await manager.train();
    manager.save();
    console.log('Bot entrenado y listo.');
};

// Procesar mensajes del usuario
const handleMessage = async (message) => {
    const response = await manager.process('es', message);
    return response.answer || 'No entendí tu mensaje. ¿Puedes reformularlo?';
};

// Exportar funciones
module.exports = { trainBot, handleMessage };