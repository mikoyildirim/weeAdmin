const formatTL = (value) => {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 2,
    })
        .format(value)
        .replace("₺", "")
        .trim() + " TL"; // ₺ işaretini sona al
};


export default formatTL