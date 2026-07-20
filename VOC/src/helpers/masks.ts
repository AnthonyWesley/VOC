export const masks = {
  phone(phone: string) {
    if (!phone) return "seu número";
    const digits = phone.replace(/\D/g, "");
    const ddd = digits.slice(0, 2);
    const last4 = digits.slice(-4);
    return `(${ddd}) *****-${last4}`;
  },

  email(email: string) {
    if (!email || !email.includes("@")) return "seu email";
    const [user, domain] = email.split("@");
    const visible = user.slice(0, Math.min(3, user.length));
    return `${visible}***@${domain}`;
  },
};
