import React from "react";

const Pagar = ({ setFieldValue, errors, touched }) => {
	return (
		<fieldset className="checkbox-group">
			<legend className="checkbox-group-legend">Escoja Metodo de Pago</legend>
			<div className="checkbox">
				<label className="checkbox-wrapper">
					<input
						className="checkbox-input"
						type="radio"
						name="metodoPago"
						value="Efectivo"
						onChange={(e) => {
							setFieldValue("metodoPago", e.target.value);
						}}
					/>
					<span className="checkbox-tile">
						<span className="checkbox-icon">
							{/* <Taxi className="custom-icon" /> */}
						</span>
						<span className="checkbox-label">Efectivo</span>
					</span>
				</label>
			</div>
			<div className="checkbox">
				<label className="checkbox-wrapper">
					<input
						className="checkbox-input"
						type="radio"
						name="metodoPago"
						value="YAPE"
						onChange={(e) => {
							setFieldValue("metodoPago", e.target.value);
						}}
					/>
					<span className="checkbox-tile">
						<span className="checkbox-icon">
							{/* <Moto className="custom-icon" /> */}
						</span>
						<span className="checkbox-label">YAPE</span>
					</span>
				</label>
			</div>
			{errors.metodoPago && touched.metodoPago && (
				<div className="ico-req">
					<i className="fa-solid fa-circle-exclamation ">
						<div className="info-req" style={{ pointerEvents: "none" }}>
							<span>{errors.metodoPago}</span>
						</div>
					</i>
				</div>
			)}
		</fieldset>
	);
};

export default Pagar;
