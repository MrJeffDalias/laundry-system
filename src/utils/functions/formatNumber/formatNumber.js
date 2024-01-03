export function formatValue(value) {
	const isNumericValue = !Number.isNaN(parseFloat(value));

	if (isNumericValue) {
		const formattedValue = `S/ ${value}`.replace(
			/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g,
			",",
		);
		return formattedValue;
	}

	return "";
}
