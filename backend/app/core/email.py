import smtplib
import logging
from email.message import EmailMessage
from app.config.settings import settings

logger = logging.getLogger(__name__)

def send_reset_email(to_email: str, token: str) -> None:
    """
    Envía un correo con el enlace de recuperación de contraseña.
    Si no hay credenciales SMTP configuradas, solo imprime el enlace en la consola.
    """
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    if not all([settings.SMTP_HOST, settings.SMTP_PORT, settings.SMTP_USER, settings.SMTP_PASSWORD]):
        logger.warning(
            f"\n{'='*50}\n"
            f"⚠️  SIMULACIÓN DE ENVÍO DE CORREO ⚠️\n"
            f"Destinatario: {to_email}\n"
            f"Enlace de recuperación: {reset_link}\n"
            f"Para enviar correos reales, configura SMTP en tu archivo .env\n"
            f"{'='*50}\n"
        )
        return

    try:
        msg = EmailMessage()
        msg['Subject'] = 'Recuperación de Contraseña - Sistema de Asistencias'
        msg['From'] = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
        msg['To'] = to_email
        
        # Versión de texto plano
        text_content = f"""
        Hola,
        
        Has solicitado restablecer tu contraseña.
        Por favor, visita el siguiente enlace para crear una nueva contraseña:
        
        {reset_link}
        
        Si no solicitaste este cambio, puedes ignorar este correo.
        El enlace expirará en 30 minutos.
        """
        msg.set_content(text_content)
        
        # Versión HTML
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4F46E5;">Recuperación de Contraseña</h2>
                <p>Hola,</p>
                <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para crear una nueva:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Restablecer Contraseña
                    </a>
                </div>
                <p>O copia y pega este enlace en tu navegador:</p>
                <p style="word-break: break-all; color: #6B7280; font-size: 14px;">{reset_link}</p>
                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                <p style="font-size: 12px; color: #9CA3AF;">Si no solicitaste este cambio, puedes ignorar este correo. El enlace expirará en 30 minutos.</p>
            </body>
        </html>
        """
        msg.add_alternative(html_content, subtype='html')
        
        # Conexión al servidor SMTP y envío
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Correo de recuperación enviado exitosamente a {to_email}")
        
    except Exception as e:
        logger.error(f"Error al enviar el correo de recuperación: {e}")
        # En caso de error, también imprimimos el link en consola como fallback
        logger.warning(f"Fallback link de recuperación: {reset_link}")
