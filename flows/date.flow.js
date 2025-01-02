const { addKeyword, EVENTS } = require("@bot-whatsapp/bot");
const { text2iso, iso2text } = require("../scripts/utils")
const { isDateAvailable, getNextAvailableSlot } = require("../scripts/calendar")
const { chat } = require("../scripts/chatgpt")

const { formFlow } = require("./form.flow")

const promptBase = `
    Eres un asistente amable y profesional. Ayuda al usuario a agendar su cita. 
    Da fechas claras y usa un tono positivo en español. Por ejemplo:
    - Si la fecha está disponible: "¡Genial! La fecha solicitada está disponible: jueves 30 de mayo a las 10:00hs."
    - Si no está disponible: "Lo siento, esa fecha no está disponible. ¿Qué te parece el jueves 30 de mayo a las 11:00hs?"
`;

const confirmationFlow = addKeyword(EVENTS.ACTION)
    .addAnswer("¿Confirmás la fecha propuesta? Respondé únicamente con 'si' o 'no'", { capture: true },
        async (ctx, ctxFn) => {
            if (ctx.body.toLowerCase().includes("si")) {
                return ctxFn.gotoFlow(formFlow)
            } else {
                await ctxFn.endFlow("Reserva cancelada. Volvé a solicitar una reserva para elegir otra fecha.");
            }
        })

const dateFlow = addKeyword(EVENTS.ACTION)
    .addAnswer("¡Perfecto! ¿Qué fecha querés agendar?", { capture: true })
    .addAnswer("Revisando disponibilidad...", null,
        async (ctx, ctxFn) => {
            const currentDate = new Date();
            const solicitedDate = await text2iso(ctx.body)

            if (solicitedDate.includes("false")) {
                return ctxFn.endFlow("No se pudo deducir una fecha. Volvé a intentar.");
            }
            const startDate = new Date(solicitedDate);

            let dateAvailable = await isDateAvailable(startDate)


            if (dateAvailable === false) {
                const nextdateAvailable = await getNextAvailableSlot(startDate)

                const isoString = nextdateAvailable.start.toISOString();
                const dateText = await iso2text(isoString)

                const messages = [{ role: "user", content: `${ctx.body}` }];
                const response = await chat(promptBase + "\nHoy es el día: " + currentDate + "\nLa fecha solicitada es: " + solicitedDate + "\nLa disponibilidad de esa fecha es: false. El próximo espacio disponible que tenés que ofrecer es: " + dateText + ". Da la fecha siempre en español", messages);
                await ctxFn.flowDynamic(response)
                await ctxFn.state.update({ date: nextdateAvailable.start });
                return ctxFn.gotoFlow(confirmationFlow)
            } else {
                const messages = [{ role: "user", content: `${ctx.body}` }];
                const response = await chat(promptBase + "\nHoy es el día: " + currentDate + "\nLa fecha solicitada es: " + solicitedDate + "\nLa disponibilidad de esa fecha es: true." + "\nConfirmación del cliente: No confirmó", messages);
                await ctxFn.flowDynamic(response)
                await ctxFn.state.update({ date: startDate });
                return ctxFn.gotoFlow(confirmationFlow)
            }
        })

module.exports = { dateFlow, confirmationFlow };