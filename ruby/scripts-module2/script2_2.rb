class Spaceship
  attr_accessor :destination

  attr_reader :name
  attr_writer :name
end

#class Spaceship
  #def destination
    #@autopilot.destination
  #end

  #def cancel_launch
  #destination = "" # creates local variable
  #self.destination = ""

  #def destination=(new_destination)
    #@autopilot.destination = new_destination
  #end
#end

ship = Spaceship.new
ship.destination = "Jupiter"
ship.name = "Dreadnought"
p ship
puts ship.destination # outputs Earth
puts ship.name
