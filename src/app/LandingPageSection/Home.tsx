import { NextPage, GetServerSideProps } from "next";
import HeroSection from "@/components/HeroSection";
import path from "path";
import fs from "fs";

// Define the structure of the statistics data
interface Statistics {
  fertilizerUsage: string;
  cropYieldGrowth: string;
  creditAccess: string;
  livestockPopulation: string;
}

interface HomeProps {
  statistics: Statistics | null;
}

const Home: NextPage<HomeProps> = ({ statistics }) => {
  return (
    <div>
      {/* Hero Section */}
      {statistics ? (
        <HeroSection
          backgroundImage="/path/to/your/background-image.jpg"
          statistics={statistics}
        />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};

// Fetch data from the JSON files on the server side
export const getServerSideProps: GetServerSideProps = async () => {
  // Read the input and livestock JSON files
  const inputFilePath = path.resolve("data", "inputData.json");
  const livestockFilePath = path.resolve("data", "livestockData.json");

  const inputData = JSON.parse(fs.readFileSync(inputFilePath, "utf8"));
  const livestockData = JSON.parse(fs.readFileSync(livestockFilePath, "utf8"));

  const statistics = {
    fertilizerUsage: inputData[0]?.fertilizer_tons || "N/A", // Example: Process this from inputData
    cropYieldGrowth: "5% Increase", // Example: Process this from data
    creditAccess: "35%", // Example: Process this from data
    livestockPopulation: livestockData[0]?.livestock_population || "N/A", // Example: Process this from livestockData
  };

  return {
    props: {
      statistics,
    },
  };
};

export default Home;
