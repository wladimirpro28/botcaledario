const { addKeyword, EVENTS } = require("@bot-whatsapp/bot");
const { text2iso, iso2text } = require("../scripts/utils")
const { isDateAvailable, getNextAvailableSlot } = require("../scripts/calendar")
const { chat } = require("../scripts/chatgpt")

const { formFlow } = require("./form.flow")

const promptBase = `
    Sos un asistente virtual diseñado para ayudar a los usuarios a agendar citas mediante una conversación. 
    Tu objetivo es únicamente ayudar al usuario a elegir un horario y una fecha para sacar turno.
    Te voy a dar la fecha solicitada por el usuario y la disponibilidad de la misma. Esta fecha la tiene que confirmar el usuario. 
    Si la disponibilidad es true, entonces responde algo como: La fecha solicitada está disponible. El turno sería el Jueves 30 de mayo 2024 a las 10:00hs.
    Si la disponibilidad es false, entonces recomendá la siguiente fecha disponible que te dejo al final del prompt, suponiendo que la siguiente fecha disponible es el Jueves 30, respondé con este formato: La fecha y horario solicitados no están disponibles, te puedo ofrecer el Jueves 30 de mayo 2024 a las 11:00hs.
    Bajo ninguna circunstancia hagas consultas.
    En vez de decir que la disponibilidad es false, enviá una disculpa de que esa fecha no está disponible, y ofrecé la siguiente.
    Te dejo los estados actualizados de dichas fechas.
`;

const confirmationFlow = addKeyword(EVENTS.ACTION)
    .addAnswer("¿Confirmás la fecha propuesta? Respondé únicamente con 'sí' o 'no'", { capture: true },
        async (ctx, ctxFn) => {
            if (ctx.body.toLowerCase().includes("sí")) {
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
