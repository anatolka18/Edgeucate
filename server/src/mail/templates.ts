export const verificationTemplate = (url: string, token: string, clientUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Подтверждение email</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f7fc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: #3D5B82; padding: 30px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 26px; font-weight: 600; letter-spacing: 1px; }
    .content { padding: 40px 35px; }
    .content h2 { color: #2d3748; font-size: 22px; margin-top: 0; margin-bottom: 16px; }
    .content p { color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 20px; }
    .content .code-box { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0; }
    .content .code-box span { font-family: monospace; font-size: 20px; font-weight: 600; color: #3D5B82; letter-spacing: 2px; }
    .btn { display: inline-block; background: #3D5B82; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background 0.3s; }
    .btn:hover { background: #2d4b6e; }
    .footer { text-align: center; padding: 20px 35px; border-top: 1px solid #e2e8f0; color: #a0aec0; font-size: 13px; background: #f7fafc; }
    .footer a { color: #3D5B82; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Edgeucate</h1>
    </div>
    <div class="content">
      <h2>Добро пожаловать в Edgeucate!</h2>
      <p>Спасибо за регистрацию. Чтобы начать пользоваться платформой, подтвердите ваш email-адрес.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" class="btn">Подтвердить email</a>
      </div>
      <p style="font-size: 14px; color: #718096;">
        Ссылка действительна <strong>24 часа</strong>. Если вы не регистрировались в Edgeucate, просто проигнорируйте это письмо.
      </p>
    </div>
    <div class="footer">
      <p>© 2026 Edgeucate. Все права защищены.</p>
      <p><a href="${clientUrl}">${clientUrl}</a></p>
    </div>
  </div>
</body>
</html>
`;

export const resetPasswordTemplate = (url: string, token: string, clientUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Восстановление пароля</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f7fc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: #3D5B82; padding: 30px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 26px; font-weight: 600; letter-spacing: 1px; }
    .content { padding: 40px 35px; }
    .content h2 { color: #2d3748; font-size: 22px; margin-top: 0; margin-bottom: 16px; }
    .content p { color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 20px; }
    .content .code-box { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0; }
    .content .code-box span { font-family: monospace; font-size: 20px; font-weight: 600; color: #3D5B82; letter-spacing: 2px; }
    .btn { display: inline-block; background: #3D5B82; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background 0.3s; }
    .btn:hover { background: #2d4b6e; }
    .footer { text-align: center; padding: 20px 35px; border-top: 1px solid #e2e8f0; color: #a0aec0; font-size: 13px; background: #f7fafc; }
    .footer a { color: #3D5B82; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Edgeucate</h1>
    </div>
    <div class="content">
      <h2>Восстановление пароля</h2>
      <p>Мы получили запрос на сброс пароля для вашего аккаунта. Перейдите по кнопке ниже, чтобы установить новый пароль.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" class="btn">Сбросить пароль</a>
      </div>
      <p style="font-size: 14px; color: #718096;">
        Ссылка действительна <strong>1 час</strong>. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо — ваш пароль останется без изменений.
      </p>
    </div>
    <div class="footer">
      <p>© 2026 Edgeucate. Все права защищены.</p>
      <p><a href="${clientUrl}">${clientUrl}</a></p>
    </div>
  </div>
</body>
</html>
`;