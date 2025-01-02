const { addKeyword, EVENTS } = require("@bot-whatsapp/bot")
const { createEvent } = require("../scripts/calendar")

const formFlow = addKeyword(EVENTS.ACTION)
    .addAnswer("¡Excelente! Gracias por confirmar la fecha. Te voy a hacer unas consultas para agendar el turno. Primero, ¿Cuál es tu nombre?", { capture: true },
        async (ctx, ctxFn) => {
            await ctxFn.state.update({ name: ctx.body }); // Guarda el nombre del usuario en el estado
        }
    )
    .addAnswer("Perfecto, ¿Cuál es el motivo del turno?", { capture: true },
        async (ctx, ctxFn) => {
            await ctxFn.state.update({ motive: ctx.body }); // Guarda el motivo en el estado
        }
    )
    .addAnswer("¡Excelente! Ya creé la cita. Te esperamos con mucho gusto. 😊 Si necesitas más información, no dudes en escribirnos. ¡Que tengas un gran día!", null,
        async (ctx, ctxFn) => {
                const userInfo = await ctxFn.state.getMyState();
                const eventName = userInfo.name;
                const description = userInfo.motive;
                const date = userInfo.date;
                const eventId = await createEvent(eventName, description, date)
                await ctxFn.state.clear();
            }
        )

module.exports = { formFlow };