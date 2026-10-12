
import React from 'react'

const OwnerDashboard = () => {
  return (
    <div className="flex items-start bg-[#f2f2f1] text-[#171717] dark:bg-[#101010] dark:text-[#F1F0ED]">

      {/* Main content */}
      <main className="min-w-0 flex-1">

        

        {/* Dashboard content */}
        <section className="min-h-[80vh] p-8">

          <h1 className="text-3xl font-normal tracking-tight sm:text-4xl">
            A clearer view of your portfolio.
          </h1>

          <p className="mt-3 text-gray-500 dark:text-[#A5A5A5]">
            Here's where things stand with your properties.
          </p>

          {/* Financial overview will go here */}

        </section>

      </main>

    </div>
  )
}

export default OwnerDashboard
