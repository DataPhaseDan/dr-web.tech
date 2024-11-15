import { useCallback, useState } from "preact/hooks";
import type { Translation } from "../utils/types.ts";

const Contact = (data: { translation: Translation["contact"] }) => {
	const [status, setStatus] = useState<"sending" | "sent" | "failed">();
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [form, setForm] = useState({
		mail: "",
		message: "",
	});
	
	const submit = useCallback(
		async (event: Event) => {
			event.preventDefault();
			try {
				if (!form.mail || !form.message) {
					throw new Error("Please fill in all fields");
				}

				setStatus("sending");
				setErrorMessage("");

				const response = await fetch("/api/mail", {
					method: "POST",
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						mail: form.mail.trim(),
						message: form.message.trim(),
					}),
				});

				const responseData = await response.json().catch(() => null);
				
				if (!response.ok) {
					throw new Error(
						responseData?.error || 
						`Failed to send message (${response.status})`
					);
				}
				
				setForm({ mail: "", message: "" });
				setStatus("sent");
			} catch (error) {
				console.error("Form submission error:", error);
				setStatus("failed");
				setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred");
			}
		},
		[form],
	);

	return (
		<>
			<h3>{data.translation.title}</h3>
			<div>
				{status === "sent" ? (
					<h3>{data.translation.sent}</h3>
				) : (
					<form onSubmit={submit} className="space-y-3">
						{status === "failed" && (
							<div className="text-red-500">
								<h3>{data.translation.failed}</h3>
								{errorMessage && <p className="text-sm mt-1">{errorMessage}</p>}
							</div>
						)}
						<div className="space-y-1">
							<label for="mail">{data.translation.mail}</label>
							<input
								type="email"
								id="mail"
								name="mail"
								className="w-full rounded-xl p-1 bg-gray-dark text-gray-light outline-none"
								required
								value={form.mail}
								onInput={(e) => {
									setForm((current) => ({
										...current,
										mail: e.currentTarget.value,
									}));
								}}
							/>
						</div>
						<div className="space-y-1">
							<label for="message">{data.translation.message}</label>
							<textarea
								id="message"
								name="message"
								className="w-full resize-none rounded-xl h-15 p-1 bg-gray-dark text-gray-light outline-none"
								required
								value={form.message}
								onInput={(e) => {
									setForm((current) => ({
										...current,
										message: e.currentTarget.value,
									}));
								}}
							/>
						</div>
						{status === "sending" ? (
							<div class="h-2 w-10 flex items-center">
								<img
									src="/vectors/loader.svg"
									class="w-full"
									alt="Loading..."
								/>
							</div>
						) : (
							<input
								type="submit"
								className="rounded-xl px-5 py-1 bg-gray-dark text-gray-light cursor-pointer transition-colors border-2 border-transparent hover:border-gray-light"
								value={data.translation.send}
							/>
						)}
					</form>
				)}
			</div>
		</>
	);
};
export default Contact;
