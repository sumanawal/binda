FactoryGirl.define do
	
	sequence(:field_name){ |n| "##{n} Field Setting" }

	factory :field_setting, class: Binda::FieldSetting do
		name { generate :field_name }
		slug { "#{name}".parameterize }
		association :field_group
	end

	factory :repeater_setting, parent: :field_setting do
		field_type 'repeater'
	end

	factory :repeater_setting_with_fields, parent: :repeater_setting do
		after(:create) do |repeater|
			repeater.children.create( name: attributes_for( :field_setting )[:name], field_type: 'string', field_group: repeater.field_group )
			repeater.children.create( name: attributes_for( :field_setting )[:name], field_type: 'text', field_group: repeater.field_group )
		end
	end

	factory :string_setting, parent: :field_setting do
		field_type 'string'
	end

	factory :text_setting, parent: :field_setting do
		field_type 'text'
	end

	factory :radio_setting, parent: :field_setting do
		field_type 'radio'
		choices '{ "apple": "f1", "banana": "f2", "cucumber": "f3" }'
		default_choice "f1"
		allow_null false
	end

end