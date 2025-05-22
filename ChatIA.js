document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const expertType = document.getElementById('expert-type');
  
    // Configuración de la API de OpenAI
    const OPENAI_API_KEY = 'TU_API_KEY'; // Reemplaza con tu API key real
    const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
  
    // Función para agregar mensajes al chat
    function addMessage(sender, message) {
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('message', sender);
      messageDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  
    // Función para obtener respuesta de la IA
    async function getAIResponse(userMessage) {
      const expert = expertType.value;
      const specialty = expert === 'ginecologo' ? 
        "Eres un ginecólogo experto. Responde preguntas sobre menstruación, anticoncepción y salud femenina de manera profesional." : 
        "Eres un psicólogo especializado en salud femenina. Responde sobre emociones, cambios de humor y bienestar mental durante el ciclo menstrual.";
  
      try {
        const response = await fetch(OPENAI_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `${specialty} Sé conciso (máximo 150 palabras) y usa lenguaje sencillo.`
              },
              {
                role: "user",
                content: userMessage
              }
            ],
            temperature: 0.7,
            max_tokens: 150
          })
        });
  
        const data = await response.json();
        return data.choices[0].message.content;
      } catch (error) {
        console.error("Error al conectar con OpenAI:", error);
        return "Lo siento, hubo un error al procesar tu consulta. Por favor intenta nuevamente.";
      }
    }
  
    // Manejar envío de mensajes
    sendBtn.addEventListener('click', async () => {
      const message = userInput.value.trim();
      if (message) {
        addMessage('Tú', message);
        userInput.value = '';
        
        // Mostrar indicador de carga
        const loadingMsg = addMessage('IA', 'Pensando...');
        
        const aiResponse = await getAIResponse(message);
        
        // Remover mensaje de carga y mostrar respuesta
        chatMessages.removeChild(loadingMsg);
        addMessage('IA', aiResponse);
      }
    });
  
    // Permitir enviar con Enter
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendBtn.click();
      }
    });
  
    // Mensaje inicial
    addMessage('IA', 'Hola, soy tu asesora de salud femenina. ¿En qué puedo ayudarte hoy?');
  });