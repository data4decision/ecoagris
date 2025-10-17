import React from 'react'
import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import AboutECOAGRIS from '@/components/AboutECOAGRIS'
import KeyDataInsights from '@/components/KeyDataInsights'
import FlagGrid from '@/components/FlagGrid'
import AgriculturalChallengesAndSolutions from '@/components/AgriculturalChallengesAndSolutions'
import Collaborators from '@/components/Collaborators'
// import NewsUpdates from '@/components/NewsUpdates'
import ContactSection from '@/components/ContactSection'
import Footer from '@/components/Footer'

const LandingPage = () => {
  return (
    <div>
        <Navbar/>
        <HeroSection/>
        <AboutECOAGRIS/>
        <KeyDataInsights/>
        <FlagGrid/>
        <AgriculturalChallengesAndSolutions/>
        <Collaborators/>
        {/* <NewsUpdates/> */}
        <ContactSection/>
        <Footer/>
    </div>
  )
}

export default LandingPage