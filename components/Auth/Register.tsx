import React, { FormEvent, useState } from "react";
import { Dialog } from "@headlessui/react";
import { useTranslations } from "next-intl";

import Button from "../Buttons/Button";
import Input from "../Input/Input";
import { useAuth } from "../../context/AuthContext";

type Props = {
  onLogin: () => void;
  errorMsg: string;
  setErrorMsg: React.Dispatch<React.SetStateAction<string>>;
  setSuccessMsg: React.Dispatch<React.SetStateAction<string>>;
};

const Register: React.FC<Props> = ({
  onLogin,
  errorMsg,
  setErrorMsg,
  setSuccessMsg,
}) => {
  const auth = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");
  const [errorDetail, setErrorDetail] = useState("");
  const t = useTranslations("LoginRegister");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorDetail("");
    if (password.length < 8) {
      setErrorMsg("password_min_length");
      return;
    }
    const regResponse = await auth.register!(email, name, password, phone, {
      address_line1: addressLine1.trim(),
      address_line2: addressLine2.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      country: country.trim() || "India",
    });
    if (regResponse.success) {
      setSuccessMsg("register_successful");
    } else {
      const key =
        regResponse.message === "alreadyExists"
          ? "email_already_exists"
          : regResponse.message === "password_too_weak"
            ? "password_too_weak"
            : regResponse.message === "invalid_email"
              ? "invalid_email"
              : "error_occurs";
      setErrorMsg(key);
      setErrorDetail(regResponse.detail ?? "");
      if (typeof window !== "undefined" && regResponse.detail) {
        console.error("[register]", regResponse.message, regResponse.detail);
      }
    }
  };

  return (
    <>
      <Dialog.Title
        as="h3"
        className="text-4xl text-center my-8 font-medium leading-6 text-gray-900"
      >
        {t("register")}
      </Dialog.Title>
      <form onSubmit={handleSubmit} className="mt-2 max-h-[70vh] overflow-y-auto pr-1">
        <Input
          type="name"
          placeholder={`${t("name")} *`}
          name="name"
          required
          extraClass="w-full focus:border-gray500"
          border="border-2 border-gray300 mb-4"
          onChange={(e) => setName((e.target as HTMLInputElement).value)}
          value={name}
        />
        <Input
          type="email"
          placeholder={`${t("email_address")} *`}
          name="email"
          required
          extraClass="w-full focus:border-gray500"
          border="border-2 border-gray300 mb-4"
          onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
          value={email}
        />
        <Input
          type="password"
          placeholder={`${t("password")} *`}
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          extraClass="w-full focus:border-gray500 mb-1"
          border="border-2 border-gray300"
          onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
          value={password}
        />
        <p className="text-gray400 text-xs mb-4">{t("password_min_length")}</p>
        <Input
          type="text"
          placeholder={`${t("phone")} *`}
          name="phone"
          required
          extraClass="w-full focus:border-gray500"
          border="border-2 border-gray300 mb-4"
          onChange={(e) => setPhone((e.target as HTMLInputElement).value)}
          value={phone}
        />

        <p className="text-xs font-semibold uppercase tracking-wide text-gray400 mb-2">
          {t("shipping_address_section")}
        </p>
        <Input
          type="text"
          placeholder={`${t("address_line1")} *`}
          name="address_line1"
          required
          extraClass="w-full focus:border-gray500"
          border="border-2 border-gray300 mb-3"
          onChange={(e) =>
            setAddressLine1((e.target as HTMLInputElement).value)
          }
          value={addressLine1}
        />
        <Input
          type="text"
          placeholder={t("address_line2_optional")}
          name="address_line2"
          extraClass="w-full focus:border-gray500"
          border="border-2 border-gray300 mb-3"
          onChange={(e) =>
            setAddressLine2((e.target as HTMLInputElement).value)
          }
          value={addressLine2}
        />
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Input
            type="text"
            placeholder={`${t("city")} *`}
            name="city"
            required
            extraClass="w-full focus:border-gray500"
            border="border-2 border-gray300"
            onChange={(e) => setCity((e.target as HTMLInputElement).value)}
            value={city}
          />
          <Input
            type="text"
            placeholder={`${t("state")} *`}
            name="state"
            required
            extraClass="w-full focus:border-gray500"
            border="border-2 border-gray300"
            onChange={(e) => setState((e.target as HTMLInputElement).value)}
            value={state}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Input
            type="text"
            placeholder={`${t("pincode")} *`}
            name="pincode"
            required
            extraClass="w-full focus:border-gray500"
            border="border-2 border-gray300"
            onChange={(e) => setPincode((e.target as HTMLInputElement).value)}
            value={pincode}
          />
          <Input
            type="text"
            placeholder={t("country")}
            name="country"
            extraClass="w-full focus:border-gray500"
            border="border-2 border-gray300"
            onChange={(e) => setCountry((e.target as HTMLInputElement).value)}
            value={country}
          />
        </div>

        {errorMsg !== "" && (
          <div className="mb-2 text-sm text-red">
            <div className="whitespace-pre-wrap">{t(errorMsg)}</div>
            {errorDetail ? (
              <div className="mt-1 max-h-24 overflow-y-auto rounded border border-red/30 bg-red/5 px-2 py-1 font-mono text-xs text-gray500">
                {errorDetail}
              </div>
            ) : null}
          </div>
        )}
        <div className="flex justify-between mb-4">
          <p className="text-gray400 text-xs">{t("register_desc")}</p>
        </div>
        <Button
          type="submit"
          value={t("register")}
          extraClass="w-full text-center text-xl mb-4"
          size="lg"
        />
        <div className="text-center text-gray400">
          {t("already_member")}{" "}
          <span
            onClick={onLogin}
            className="text-gray500 focus:outline-none focus:underline cursor-pointer"
          >
            {t("login")}
          </span>
        </div>
      </form>
    </>
  );
};

export default Register;
