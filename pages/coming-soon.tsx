import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import AppHeader from "../components/Header/AppHeader";
import { GetServerSideProps } from "next";

type Props = {
  locale: string;
};

const ComingSoon = (props: Props) => {
  const t = useTranslations("Others");
  return (
    <>
      <AppHeader title="Coming Soon!" />
      <div className="flex flex-col h-screen justify-center items-center">
        <h1 className="text-3xl tracking-wider leading-10">
          {t("coming_soon")}
        </h1>
        <h2 className="text-2xl text-gray500 mt-2">
          {t("page_not_created_msg")}
        </h2>
        <Image
          src="/bg-img/coding.svg"
          alt="Not created yet"
          width={400}
          height={300}
        />
        <span className="text-gray400">
          {t("go_back_to")}{" "}
          <Link
            href="/"
            className="underline font-bold hover:text-gray500"
          >
            home page
          </Link>
          ?
        </span>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({
  locale,
}) => {
  return {
    props: {
      locale: locale || "en",
      messages: (await import(`../messages/common/${locale}.json`)).default,
    },
  };
};

export default ComingSoon;
